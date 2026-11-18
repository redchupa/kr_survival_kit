"""Run a real, isolated Home Assistant Core setup and storage smoke test."""

import asyncio
import json
import logging
import shutil
import tempfile
from datetime import timedelta
from importlib.metadata import version
from pathlib import Path

from homeassistant.components import frontend
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
        catalog = custom_dir / "content" / "catalog.ko.json"
        hidden_catalog = catalog.with_suffix(".missing")
        catalog.rename(hidden_catalog)
        try:
            incomplete = await hass.config_entries.flow.async_init(
                DOMAIN, context={"source": "user"}, data={"inspection_days": 30}
            )
            assert incomplete["type"] == "abort", incomplete
            assert incomplete["reason"] == "incomplete_install", incomplete
            assert not hass.config_entries.async_entries(DOMAIN)
        finally:
            hidden_catalog.rename(catalog)
        flow = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": "user"}, data={"inspection_days": 30}
        )
        assert flow["type"] == "create_entry", flow
        entry = flow["result"]
        await hass.async_block_till_done()
        panel = hass.data[frontend.DATA_PANELS]["kr-survival-kit"]
        assert panel.sidebar_title == "KR Survival Kit"
        assert panel.require_admin
        assert panel.config["guide"]["scenarios"]
        assert panel.config["quiz"]["questions"]
        assert panel.config["_panel_custom"]["module_url"].startswith("/kr_survival_kit_assets/")
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
        assert before["household_size"] == 4
        assert before["default_review_interval_days"] == 30
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
                 {"lot_id": "2 L bottle", "quantity": 2000, "expires_on": expiring_date,
                  "received_on": dt_util.now().date().isoformat()},
                 {"lot_id": "1.25 L bottle", "quantity": 1250, "expires_on": expiring_date,
                  "received_on": dt_util.now().date().isoformat()},
                 {"lot_id": "legacy 1 ml", "quantity": 1, "expires_on": expiring_date},
             ],
             "confirm": True, "review_interval_days": 14},
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
        assert water_record["review_interval_days"] == 14
        assert water_record["lots"][0]["received_on"] == dt_util.now().date().isoformat()
        assert "received_on" not in water_record["lots"][2]
        restored_view = await restarted.services.async_call(
            DOMAIN, "get_inventory", {}, blocking=True, return_response=True, context=context,
        )
        water_status = restored_view["summary"]["items"]["drinking-water"]
        assert water_status["review_interval_days"] == 14
        assert water_status["review_days_remaining"] == 14
        assert water_status["expiry_days_remaining"] == 7
        assert water_status["next_review_on"] == (dt_util.now().date() + timedelta(days=14)).isoformat()
        for bad_interval in (0, True, 3651):
            try:
                await restarted.services.async_call(
                    DOMAIN, "set_item",
                    {"item_id": "drinking-water", "revision": 2, "applicable": True,
                     "target": 3251, "lots": [], "confirm": True,
                     "review_interval_days": bad_interval}, blocking=True, context=context,
                )
            except Exception:
                pass
            else:
                raise AssertionError("Invalid review interval was accepted")
        assert restored_entry.runtime_data.snapshot["revision"] == 2
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
        household = await restarted.services.async_call(
            DOMAIN, "set_household_size", {"revision": 6, "household_size": 5},
            blocking=True, return_response=True, context=context,
        )
        assert household["revision"] == 7
        household = await restarted.services.async_call(
            DOMAIN, "get_inventory", {}, blocking=True, return_response=True, context=context,
        )
        assert household["household_size"] == 5
        water = household["summary"]["items"]["drinking-water"]
        assert (water["recommended_target"], water["target"]) == (30000, 3251)
        await restarted.async_stop()
        final_ha = await start_ha(config_dir)
        final_entry = final_ha.config_entries.async_get_entry(entry.entry_id)
        assert final_entry.runtime_data.snapshot["household_size"] == 5
        assert await final_ha.config_entries.async_unload(entry.entry_id)
        assert "kr-survival-kit" not in final_ha.data[frontend.DATA_PANELS]
        frontend.async_register_built_in_panel(final_ha, "lovelace", frontend_url_path="kr-survival-kit")
        existing_panel = final_ha.data[frontend.DATA_PANELS]["kr-survival-kit"]
        assert await final_ha.config_entries.async_setup(entry.entry_id)
        assert await final_ha.config_entries.async_unload(entry.entry_id)
        assert final_ha.data[frontend.DATA_PANELS]["kr-survival-kit"] is existing_panel
        await final_ha.async_stop()
        print(json.dumps({"ha_core": version("homeassistant"), "entry": "created_and_restarted", "sensors": 3,
                          "saved_revision": 7, "household": "4_to_5_and_restored", "stale_revision": "rejected", "save_failure": "rejected",
                          "viewer": "read_write_rejected", "boolean_input": "rejected",
                          "ration": "added_edited_deleted", "water_litre_roundtrip": "3251ml_after_restart",
                          "concurrent_edit": "one_rejected", "received_on": "roundtrip",
                          "review_interval_days": "roundtrip_and_invalid_rejected"}))


if __name__ == "__main__":
    asyncio.run(main())
