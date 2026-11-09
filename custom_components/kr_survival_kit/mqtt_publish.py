"""Optional, aggregate-only MQTT Discovery publisher."""

import asyncio
import json
import logging
from datetime import timedelta

from homeassistant.components import mqtt
from homeassistant.components.mqtt.const import DEFAULT_PREFIX
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .inventory import summarize

_LOGGER = logging.getLogger(__name__)
PUBLISH_INTERVAL = 60
EXPIRE_AFTER = 180
METRICS = {
    "shortage_count": "부족한 품목",
    "needs_check_count": "확인할 품목",
    "expiring_count": "기한 임박 품목",
}


class MqttPublisher:
    """Publish derived counts after local writes and on broker recovery."""

    def __init__(self, hass, entry, inventory):
        self.hass = hass
        self.entry = entry
        self.inventory = inventory
        self._lock = asyncio.Lock()
        self._unsubscribers = []
        self._active = True
        self._discovery_sent = False

    def _mqtt_entry(self):
        entries = self.hass.config_entries.async_entries("mqtt")
        return entries[0] if len(entries) == 1 else None

    def _connected(self):
        return self._mqtt_entry() is not None and mqtt.DATA_MQTT in self.hass.data and mqtt.is_connected(self.hass)

    def _topics(self):
        mqtt_entry = self._mqtt_entry()
        if mqtt_entry is None:
            return None
        prefix = mqtt_entry.options.get(mqtt.CONF_DISCOVERY_PREFIX, DEFAULT_PREFIX)
        base = f"kr_survival_kit/{self.entry.entry_id}"
        return {
            metric: (f"{prefix}/sensor/{DOMAIN}_{self.entry.entry_id}/{metric}/config",
                     f"{base}/{metric}/state")
            for metric in METRICS
        }

    def start(self):
        self._unsubscribers.append(mqtt.async_subscribe_connection_status(self.hass, self._connection_changed))
        self._unsubscribers.append(async_track_time_interval(self.hass, self._tick, timedelta(seconds=PUBLISH_INTERVAL)))
        self.inventory.listeners.append(self._schedule)
        self._schedule()

    def _connection_changed(self, connected):
        self.hass.add_job(self._handle_connection_change, connected)

    async def _handle_connection_change(self, connected):
        self._discovery_sent = False
        if connected:
            await self.publish()

    def _tick(self, _now):
        self._schedule()

    def _schedule(self):
        if self._active:
            self.hass.add_job(self.publish)

    async def publish(self):
        async with self._lock:
            if not self._active or not self._connected():
                return
            topics = self._topics()
            if topics is None:
                return
            try:
                if self.entry.options.get("mqtt_cleanup_pending", False):
                    for config_topic, _ in topics.values():
                        await mqtt.async_publish(self.hass, config_topic, "", qos=1, retain=True)
                    self.hass.config_entries.async_update_entry(
                        self.entry,
                        options={**self.entry.options, "mqtt_cleanup_pending": False},
                    )
                    if not self.entry.options.get("mqtt_enabled", False):
                        return
                if not self.entry.options.get("mqtt_enabled", False):
                    return
                counts = summarize(
                    self.inventory.catalog.values(), self.inventory.snapshot["items"],
                    dt_util.now().date(), self.entry.data["inspection_days"],
                )
                if not self._discovery_sent:
                    for metric, (config_topic, state_topic) in topics.items():
                        config = {
                            "name": METRICS[metric],
                            "unique_id": f"{DOMAIN}_{self.entry.entry_id}_mqtt_{metric}",
                            "state_topic": state_topic,
                            "expire_after": EXPIRE_AFTER,
                            "unit_of_measurement": "개",
                            "state_class": "measurement",
                        }
                        await mqtt.async_publish(self.hass, config_topic, json.dumps(config, ensure_ascii=False), qos=1, retain=True)
                    self._discovery_sent = True
                    await asyncio.sleep(1)
                for metric, (_, state_topic) in topics.items():
                    await mqtt.async_publish(self.hass, state_topic, str(counts[metric]), qos=1, retain=False)
            except Exception:
                _LOGGER.exception("MQTT publication failed; local inventory is still available")

    async def close(self):
        self._active = False
        for unsubscribe in self._unsubscribers:
            unsubscribe()
        self.inventory.listeners.remove(self._schedule)
        async with self._lock:
            return


async def async_remove_discovery(hass, entry):
    """Best-effort cleanup when an enabled config entry is removed."""
    if mqtt.DATA_MQTT not in hass.data or not mqtt.is_connected(hass):
        _LOGGER.warning("MQTT Discovery cleanup pending; see README for manual topics")
        return
    mqtt_entries = hass.config_entries.async_entries("mqtt")
    if len(mqtt_entries) != 1:
        return
    prefix = mqtt_entries[0].options.get(mqtt.CONF_DISCOVERY_PREFIX, DEFAULT_PREFIX)
    for metric in METRICS:
        topic = f"{prefix}/sensor/{DOMAIN}_{entry.entry_id}/{metric}/config"
        await mqtt.async_publish(hass, topic, "", qos=1, retain=True)
