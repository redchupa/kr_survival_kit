"""End-to-end MQTT checks with an isolated HA Core and real Mosquitto broker."""

import asyncio
import json
import logging
import shutil
import socket
import subprocess
import tempfile
from pathlib import Path

import paho.mqtt.client as paho

from homeassistant.core import Context
from homeassistant.helpers import entity_registry
from homeassistant.setup import async_setup_component

from ha_smoke import DOMAIN, SOURCE, start_ha


PORT = 18885


async def until(predicate, seconds=30):
    for _ in range(seconds * 5):
        if predicate():
            return
        await asyncio.sleep(0.2)
    raise AssertionError("Timed out waiting for MQTT or HA state")


async def start_broker():
    broker = subprocess.Popen(
        ["mosquitto", "-p", str(PORT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    await until(lambda: _port_open(PORT), 10)
    return broker


def _port_open(port):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.2):
            return True
    except OSError:
        return False


def observer(messages):
    client = paho.Client(paho.CallbackAPIVersion.VERSION2)

    def on_connect(client, _userdata, _flags, _reason, _properties):
        client.subscribe([(f"homeassistant/sensor/#", 1), (f"kr_survival_kit/#", 1)])

    def on_message(_client, _userdata, message):
        messages.append((message.topic, bytes(message.payload), message.retain, message.qos))

    client.on_connect = on_connect
    client.on_message = on_message
    client.connect("127.0.0.1", PORT)
    client.loop_start()
    return client


async def main():
    logging.basicConfig(level=logging.ERROR)
    with tempfile.TemporaryDirectory(prefix="kr-survival-p3-") as config_dir:
        (Path(config_dir) / "configuration.yaml").write_text("homeassistant:\n", encoding="utf-8")
        shutil.copytree(SOURCE, Path(config_dir) / "custom_components" / DOMAIN,
                        ignore=shutil.ignore_patterns("__pycache__"))
        broker = await start_broker()
        messages = []
        watcher = observer(messages)
        try:
            hass = await start_ha(config_dir)
            from custom_components.kr_survival_kit import mqtt_publish
            mqtt_publish.EXPIRE_AFTER = 3
            assert await async_setup_component(hass, "mqtt", {})
            mqtt_flow = await hass.config_entries.flow.async_init("mqtt", context={"source": "user"})
            assert mqtt_flow["type"] == "form", mqtt_flow
            mqtt_flow = await hass.config_entries.flow.async_configure(
                mqtt_flow["flow_id"], {"broker": "127.0.0.1", "port": PORT,
                                       "other_settings": {"set_client_cert": False, "set_ca_cert": "off"}}
            )
            assert mqtt_flow["type"] == "create_entry", mqtt_flow
            await hass.async_block_till_done()
            kit_flow = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": "user"}, data={"inspection_days": 30}
            )
            assert kit_flow["type"] == "create_entry", kit_flow
            kit_entry = kit_flow["result"]
            await hass.async_block_till_done()
            assert not any("kr_survival_kit_" in topic for topic, *_ in messages)

            options = await hass.config_entries.options.async_init(kit_entry.entry_id)
            assert options["type"] == "form", options
            options = await hass.config_entries.options.async_configure(
                options["flow_id"], {"mqtt_enabled": True}
            )
            assert options["type"] == "create_entry", options
            await until(lambda: sum(bool(topic.endswith("/config") and payload) for topic, payload, *_ in messages) >= 3)
            await until(lambda: sum(topic.endswith("/state") for topic, *_ in messages) >= 3)
            configs = [json.loads(payload) for topic, payload, *_ in messages
                       if topic.endswith("/config") and payload and "kr_survival_kit_" in topic]
            assert len(configs) >= 3
            assert all(config["expire_after"] == 3 for config in configs)
            states = [(topic, payload, retain, qos) for topic, payload, retain, qos in messages
                      if topic.endswith("/state")]
            assert all(not retain and qos == 1 for topic, payload, retain, qos in states)
            retained_before = []
            retained_watcher = observer(retained_before)
            await until(lambda: sum(topic.endswith("/config") and retain
                                    for topic, _, retain, _ in retained_before) >= 3)
            assert not any(topic.endswith("/state") for topic, *_ in retained_before)
            retained_watcher.disconnect()
            retained_watcher.loop_stop()
            registry = entity_registry.async_get(hass)
            mqtt_entities = lambda: [entity.entity_id for entity in registry.entities.values()
                                     if entity.platform == "mqtt" and "kr_survival_kit_" in entity.unique_id]
            await until(lambda: len(mqtt_entities()) == 3)
            await until(lambda: all(hass.states.get(entity_id).state == "unavailable"
                                    for entity_id in mqtt_entities()), 10)
            publisher = hass.data[DOMAIN][kit_entry.entry_id]
            await publisher.publish()
            try:
                await until(lambda: all(hass.states.get(entity_id).state.isdigit()
                                        for entity_id in mqtt_entities()), 8)
            except AssertionError:
                raise AssertionError({"entities": {entity_id: str(hass.states.get(entity_id))
                                      for entity_id in mqtt_entities()},
                                      "recent": [(topic, payload.decode(), retain, qos)
                                                 for topic, payload, retain, qos in messages[-12:]]}) from None
            await publisher.publish()
            assert len(mqtt_entities()) == 3

            admin = await hass.auth.async_create_user("P3 Admin", group_ids=["system-admin"])
            before = await hass.services.async_call(DOMAIN, "get_inventory", {},
                blocking=True, return_response=True, context=Context(user_id=admin.id))
            broker.terminate()
            broker.wait(timeout=5)
            await asyncio.sleep(2)
            await hass.services.async_call(DOMAIN, "set_item", {
                "item_id": "drinking-water", "revision": before["revision"],
                "applicable": True, "target": 1000, "lots": [], "confirm": True,
            }, blocking=True, context=Context(user_id=admin.id))
            assert kit_entry.runtime_data.snapshot["revision"] == 1
            broker = await start_broker()
            watcher.disconnect()
            watcher.loop_stop()
            watcher = observer(messages)
            await until(lambda: any(topic.endswith("shortage_count/state") and payload == b"1"
                                    for topic, payload, *_ in messages), 45)

            await hass.async_stop()
            previous_states = sum(topic.endswith("/state") for topic, *_ in messages)
            hass = await start_ha(config_dir)
            await until(lambda: sum(topic.endswith("/state") for topic, *_ in messages) > previous_states, 45)
            kit_entry = next(e for e in hass.config_entries.async_entries(DOMAIN))
            assert kit_entry.runtime_data.snapshot["revision"] == 1
            broker.terminate()
            broker.wait(timeout=5)
            await asyncio.sleep(2)
            options = await hass.config_entries.options.async_init(kit_entry.entry_id)
            await hass.config_entries.options.async_configure(
                options["flow_id"], {"mqtt_enabled": False}
            )
            assert kit_entry.options["mqtt_cleanup_pending"] is True
            broker = await start_broker()
            watcher.disconnect()
            watcher.loop_stop()
            watcher = observer(messages)
            await until(lambda: sum(topic.endswith("/config") and payload == b""
                                    for topic, payload, *_ in messages) >= 3, 45)
            await until(lambda: kit_entry.options["mqtt_cleanup_pending"] is False)
            retained = []
            fresh_watcher = observer(retained)
            await asyncio.sleep(1)
            assert not any(topic.endswith("/config") and payload for topic, payload, *_ in retained)
            fresh_watcher.disconnect()
            fresh_watcher.loop_stop()
            await hass.async_stop()
            print(json.dumps({"ha_core": "2026.11.0", "broker": "Mosquitto 2.0.18",
                              "discovery": "created_and_deleted", "broker_restart": "recovered",
                              "ha_restart": "recovered", "offline_edit": "saved",
                              "expiry": "unavailable_then_recovered", "qos_duplicates": "one_entity_per_metric"}))
        finally:
            watcher.disconnect()
            watcher.loop_stop()
            broker.terminate()
            broker.wait(timeout=5)


if __name__ == "__main__":
    asyncio.run(main())
