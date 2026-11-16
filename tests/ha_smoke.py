"""Run a real, isolated Home Assistant Core setup and storage smoke test."""

import asyncio
import json
import logging
import shutil
import tempfile
from datetime import timedelta
from importlib.metadata import version
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
    # The isolated host does not ship optional OS media tools used by unrelated
    # default integrations. Exercise HA Core and this component only.
    defaults = bootstrap.DEFAULT_INTEGRATIONS
    bootstrap.DEFAULT_INTEGRATIONS = set()
    try:
        assert await bootstrap.async_from_config_dict({}, hass)
    finally:
        bootstrap.DEFAULT_INTEGRATIONS = defaults
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
        water_catalog = next(item for item in before["catalog"] if item["id"] == "drinking-water")
        assert (water_catalog["unit"], water_catalog["display_unit"], water_catalog["display_scale"]) == ("ml", "L", 1000)
        updated = await hass.services.async_call(
            DOMAIN, "set_item",
            {
                "item_id": "drinking-water",
                "revision": 0,
                "applicable": True,
                "target": 3251,
                "lots": [],
                "confirm": True,
            },
            blocking=True, return_response=True, context=context,
        )
        assert updated["revision"] == 1
        try:
            await hass.services.async_call(
                DOMAIN, "set_item",
                {"item_id": "flashlight", "revision": True, "applicable": True,
                 "target": True, "lots": [], "confirm": True},
                blocking=True, context=context,
            )
        except Exception as error:
            assert "integer" in str(error) and "revision" in str(error), error
        else:
            raise AssertionError("Boolean revision/target was accepted")
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
        for service, payload in (
            ("set_item", {"item_id": "flashlight", "revision": 1, "applicable": True,
                          "target": 1, "lots": [], "confirm": True}),
            ("delete_item", {"item_id": "drinking-water", "revision": 1}),
        ):
            try:
                await hass.services.async_call(
                    DOMAIN, service, payload, blocking=True,
                    context=Context(user_id=viewer.id),
                )
            except Unauthorized:
                pass
            else:
                raise AssertionError(f"Non-admin {service} was accepted")
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
             "target": 3251,
             "lots": [
                 {"lot_id": "2 L bottle", "quantity": 2000, "expires_on": expiring_date},
                 {"lot_id": "1.25 L bottle", "quantity": 1250, "expires_on": expiring_date},
                 {"lot_id": "legacy 1 ml", "quantity": 1, "expires_on": expiring_date},
             ],
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
        water_record = restored_entry.runtime_data.snapshot["items"]["drinking-water"]
        assert water_record["target"] == 3251
        assert [lot["quantity"] for lot in water_record["lots"]] == [2000, 1250, 1]
        assert restarted.states.get(inventory_states["부족한 품목"].entity_id).state == "0"
        assert restarted.states.get(inventory_states["기한 임박 품목"].entity_id).state == "1"
        ration_date = (dt_util.now().date() + timedelta(days=12)).isoformat()
        added = await restarted.services.async_call(
            DOMAIN, "set_item",
            {"item_id": "self-heating-ration", "revision": 2, "applicable": True,
             "target": 2, "lots": [{"lot_id": "ration-a", "quantity": 1,
                                   "expires_on": ration_date}], "confirm": True},
            blocking=True, return_response=True, context=context,
        )
        assert added["revision"] == 3
        edited = await restarted.services.async_call(
            DOMAIN, "set_item",
            {"item_id": "self-heating-ration", "revision": 3, "applicable": True,
             "target": 2, "lots": [
                 {"lot_id": "ration-a", "quantity": 1, "expires_on": ration_date},
                 {"lot_id": "ration-b", "quantity": 1, "expires_on": None},
             ], "confirm": True},
            blocking=True, return_response=True, context=context,
        )
        assert edited["revision"] == 4
        result = await restarted.services.async_call(
            DOMAIN, "get_inventory", {},
            blocking=True, return_response=True, context=context,
        )
        ration = result["summary"]["items"]["self-heating-ration"]
        assert ration["next_expiry_on"] == ration_date
        assert ration["unknown_date_quantity"] == 1
        assert ration["state"] == "needs_check"
        deleted = await restarted.services.async_call(
            DOMAIN, "delete_item",
            {"item_id": "self-heating-ration", "revision": 4},
            blocking=True, return_response=True, context=context,
        )
        assert deleted["revision"] == 5
        result = await restarted.services.async_call(
            DOMAIN, "get_inventory", {},
            blocking=True, return_response=True, context=context,
        )
        assert "self-heating-ration" not in result["items"]
        assert result["summary"]["items"]["self-heating-ration"]["state"] == "not_applicable"

        async def competing(item_id):
            return await restarted.services.async_call(
                DOMAIN, "set_item",
                {"item_id": item_id, "revision": 5, "applicable": True,
                 "target": 1, "lots": [], "confirm": True},
                blocking=True, return_response=True, context=context,
            )

        competing_results = await asyncio.gather(
            competing("butane-canister"), competing("flashlight"),
            return_exceptions=True,
        )
        assert sum(isinstance(item, HomeAssistantError) for item in competing_results) == 1
        assert restarted.config_entries.async_get_entry(entry.entry_id).runtime_data.snapshot["revision"] == 6
        await restarted.async_stop()
        print(json.dumps({"ha_core": version("homeassistant"), "entry": "created_and_restarted", "sensors": 3,
                          "saved_revision": 6, "stale_revision": "rejected", "save_failure": "rejected",
                          "viewer": "read_write_rejected", "boolean_input": "rejected",
                          "ration": "added_edited_deleted", "water_litre_roundtrip": "3251ml_after_restart",
                          "concurrent_edit": "one_rejected"}))


if __name__ == "__main__":
    asyncio.run(main())
