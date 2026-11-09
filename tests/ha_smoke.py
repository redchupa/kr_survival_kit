"""Run a real, isolated Home Assistant Core setup and storage smoke test."""

import asyncio
import json
import logging
import shutil
import tempfile
from datetime import timedelta
from pathlib import Path

from homeassistant.core import Context, HomeAssistant
from homeassistant import bootstrap, loader
from homeassistant.exceptions import HomeAssistantError, Unauthorized
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util

DOMAIN = "kr_survival_kit"
SOURCE = Path(__file__).resolve().parents[1] / "custom_components" / DOMAIN


async def start_ha(config_dir):
    hass = HomeAssistant(config_dir)
    loader.async_setup(hass)
    import custom_components
    custom_path = str(Path(config_dir) / "custom_components")
    if custom_path not in custom_components.__path__:
        custom_components.__path__.append(custom_path)
    assert DOMAIN in await loader.async_get_custom_components(hass)
    assert await bootstrap.async_from_config_dict({}, hass)
    await hass.async_start()
    assert await async_setup_component(hass, DOMAIN, {})
    return hass


async def main():
    logging.basicConfig(level=logging.WARNING)
    with tempfile.TemporaryDirectory(prefix="kr-survival-ha-") as config_dir:
        custom_dir = Path(config_dir) / "custom_components" / DOMAIN
        shutil.copytree(SOURCE, custom_dir, ignore=shutil.ignore_patterns("__pycache__"))
        hass = await start_ha(config_dir)
        flow = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": "user"}, data={"inspection_days": 30}
        )
        assert flow["type"] == "create_entry", flow
        entry = flow["result"]
        await hass.async_block_till_done()
        states = hass.states.async_all("sensor")
        inventory_states = {
            state.attributes.get("friendly_name"): state
            for state in states
            if state.attributes.get("friendly_name") in {"부족한 품목", "확인할 품목", "기한 임박 품목"}
        }
        assert len(inventory_states) == 3, states
        assert inventory_states["부족한 품목"].state == "0"
        assert inventory_states["확인할 품목"].state == "9"
        admin = await hass.auth.async_create_user("Test Admin", group_ids=["system-admin"])
        context = Context(user_id=admin.id)
        before = await hass.services.async_call(
            DOMAIN, "get_inventory", {},
            blocking=True, return_response=True, context=context,
        )
        assert before["revision"] == 0, before
        assert any(item["id"] == "drinking-water" for item in before["catalog"])
        updated = await hass.services.async_call(
            DOMAIN, "set_item",
            {
                "item_id": "drinking-water",
                "revision": 0,
                "applicable": True,
                "target": 1000,
                "lots": [],
                "confirm": True,
            },
            blocking=True, return_response=True, context=context,
        )
        assert updated["revision"] == 1
        inventory = entry.runtime_data
        original_save = inventory.store.async_save

        async def fail_save(_data):
            raise OSError("simulated full disk")

        inventory.store.async_save = fail_save
        try:
            try:
                await hass.services.async_call(
                    DOMAIN, "set_item",
                    {"entry_id": entry.entry_id, "item_id": "flashlight", "revision": 1,
                     "applicable": True, "target": 1, "lots": [], "confirm": True},
                    blocking=True, context=context,
                )
            except HomeAssistantError as error:
                assert "save failed" in str(error)
            else:
                raise AssertionError("Simulated save failure was accepted")
        finally:
            inventory.store.async_save = original_save
        assert inventory.snapshot["revision"] == 1
        try:
            await hass.services.async_call(
                DOMAIN, "set_item",
                {"entry_id": entry.entry_id, "item_id": "drinking-water", "revision": 0,
                 "applicable": True, "target": 1000, "lots": [], "confirm": True},
                blocking=True, context=context,
            )
        except HomeAssistantError:
            pass
        else:
            raise AssertionError("Stale revision was accepted")
        viewer = await hass.auth.async_create_user("Test Viewer")
        try:
            await hass.services.async_call(
                DOMAIN, "get_inventory", {"entry_id": entry.entry_id},
                blocking=True, return_response=True, context=Context(user_id=viewer.id),
            )
        except Unauthorized:
            pass
        else:
            raise AssertionError("Non-admin read was accepted")
        after = await hass.services.async_call(
            DOMAIN, "get_inventory", {"entry_id": entry.entry_id},
            blocking=True, return_response=True, context=context,
        )
        assert after["summary"]["items"]["drinking-water"]["state"] == "shortage"
        await hass.async_block_till_done()
        assert hass.states.get(inventory_states["부족한 품목"].entity_id).state == "1"
        assert hass.states.get(inventory_states["확인할 품목"].entity_id).state == "8"
        expiring_date = (dt_util.now().date() + timedelta(days=7)).isoformat()
        updated = await hass.services.async_call(
            DOMAIN, "set_item",
            {"item_id": "drinking-water", "revision": 1, "applicable": True,
             "target": 1000,
             "lots": [{"lot_id": "water-case", "quantity": 1000, "expires_on": expiring_date}],
             "confirm": True},
            blocking=True, return_response=True, context=context,
        )
        assert updated["revision"] == 2
        await hass.async_block_till_done()
        assert hass.states.get(inventory_states["부족한 품목"].entity_id).state == "0"
        assert hass.states.get(inventory_states["기한 임박 품목"].entity_id).state == "1"
        await hass.async_stop()
        restarted = await start_ha(config_dir)
        restored_entry = restarted.config_entries.async_get_entry(entry.entry_id)
        assert restored_entry is not None
        await restarted.async_block_till_done()
        assert restored_entry.runtime_data.snapshot["revision"] == 2
        assert restored_entry.runtime_data.snapshot["items"]["drinking-water"]["target"] == 1000
        assert restarted.states.get(inventory_states["부족한 품목"].entity_id).state == "0"
        assert restarted.states.get(inventory_states["기한 임박 품목"].entity_id).state == "1"
        await restarted.async_stop()
        print(json.dumps({"ha_core": "2026.11.0", "entry": "created_and_restarted", "sensors": 3,
                          "saved_revision": 2, "stale_revision": "rejected", "save_failure": "rejected",
                          "viewer": "rejected"}))


if __name__ == "__main__":
    asyncio.run(main())
