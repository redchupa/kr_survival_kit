"""Run a real, isolated Home Assistant Core setup and storage smoke test."""

import asyncio
import json
import logging
import shutil
import tempfile
from datetime import timedelta
from importlib.metadata import version
from pathlib import Path

import voluptuous as vol
import voluptuous_serialize
from homeassistant.helpers import config_validation as cv
from homeassistant.components import frontend
from homeassistant.core import Context, HomeAssistant
from homeassistant import bootstrap, loader
from homeassistant.exceptions import HomeAssistantError, Unauthorized
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util

DOMAIN = "kr_survival_kit"
SOURCE = Path(__file__).resolve().parents[1] / "custom_components" / DOMAIN
# Derive expected counts from the catalog so adding items does not silently break this smoke test.
CATALOG_ITEMS = json.loads((SOURCE / "content" / "catalog.ko.json").read_text(encoding="utf-8"))["items"]
CORE_ITEM_COUNT = sum(item["tier"] not in ("household", "optional") for item in CATALOG_ITEMS)


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


BLUEPRINT = SOURCE / "blueprints" / "automation" / "weekly_rotation_alert.yaml"


async def check_weekly_blueprint(hass):
    """The shipped blueprint validates, and its alert condition reads the real sensors."""
    from homeassistant.components.automation.config import AUTOMATION_BLUEPRINT_SCHEMA
    from homeassistant.components.blueprint import models as bp_models
    from homeassistant.helpers import entity_registry as er
    from homeassistant.helpers.template import Template
    from homeassistant.util.yaml import load_yaml_dict

    blueprint = bp_models.Blueprint(
        load_yaml_dict(str(BLUEPRINT)), expected_domain="automation", schema=AUTOMATION_BLUEPRINT_SCHEMA,
    )
    selectors = {name: blueprint.inputs[name]["selector"]["entity"]["filter"]
                 for name in ("expiring_sensor", "shortage_sensor", "needs_check_sensor")}
    assert all(f == [{"integration": DOMAIN, "domain": "sensor"}] for f in selectors.values()), selectors

    def evaluate(chosen):
        inputs = bp_models.BlueprintInputs(blueprint, {"use_blueprint": {"path": BLUEPRINT.name, "input": {
            "notify_device": "phone", **chosen}}})
        inputs.validate()
        config = inputs.async_substitute()
        values = {}
        for key, value in config["variables"].items():
            values[key] = Template(value, hass).async_render(values) if isinstance(value, str) and "{{" in value else value
        condition = Template(config["conditions"][1]["value_template"], hass).async_render(values)
        return values, condition

    values, condition = evaluate({})
    # Fresh install: every core item still needs a first check, so the weekly alert fires.
    assert values["needs_check"] == CORE_ITEM_COUNT and values["shortage"] == 0, values
    assert condition is True, condition
    # Renaming a sensor keeps the blueprint working once the renamed sensor is chosen.
    registry = er.async_get(hass)
    registry.async_update_entity(f"sensor.{DOMAIN}_needs_check_count", new_entity_id="sensor.our_home_to_check")
    await hass.async_block_till_done()
    values, condition = evaluate({"needs_check_sensor": "sensor.our_home_to_check"})
    assert values["needs_check"] == CORE_ITEM_COUNT and condition is True, values
    registry.async_update_entity("sensor.our_home_to_check", new_entity_id=f"sensor.{DOMAIN}_needs_check_count")
    await hass.async_block_till_done()


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
        form = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
        assert form["type"] == "form", form
        schema = form["data_schema"]
        assert schema({}) == {"household_size": 4, "inspection_days": 90}
        fields = {f["name"]: f for f in voluptuous_serialize.convert(schema, custom_serializer=cv.custom_serializer)}
        assert fields["household_size"]["selector"]["number"] | {"unit_of_measurement": None} == {
            "min": 1, "max": 99, "step": 1, "mode": "box", "unit_of_measurement": None}, fields
        assert fields["inspection_days"]["selector"]["number"]["mode"] == "box", fields
        assert (fields["inspection_days"]["selector"]["number"]["min"],
                fields["inspection_days"]["selector"]["number"]["max"]) == (7, 365), fields
        assert schema({"household_size": "6", "inspection_days": 120.0}) == {"household_size": 6, "inspection_days": 120}
        for bad in ({"household_size": 0}, {"household_size": 100}, {"household_size": 2.5},
                    {"inspection_days": 6}, {"inspection_days": 366}, {"inspection_days": "abc"}):
            try:
                schema(bad)
            except vol.Invalid:
                pass
            else:
                raise AssertionError(f"accepted out-of-range setup value {bad}")
        hass.config_entries.flow.async_abort(form["flow_id"])
        flow = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": "user"}, data={"inspection_days": 30, "household_size": 4}
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
        # New installs get stable ASCII entity ids, not a transliteration of the Korean names.
        for metric in ("shortage_count", "needs_check_count", "expiring_count"):
            assert hass.states.get(f"sensor.{DOMAIN}_{metric}") is not None, metric
        await check_weekly_blueprint(hass)
        assert inventory_states["부족한 품목"].state == "0"
        # Fresh install: every core item is applicable but unverified.
        assert inventory_states["확인할 품목"].state == str(CORE_ITEM_COUNT)
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
        # Drinking water moved from "needs check" to "shortage".
        assert hass.states.get(inventory_states["확인할 품목"].entity_id).state == str(CORE_ITEM_COUNT - 1)
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
        today = dt_util.now().date()
        reminder = await restarted.services.async_call(
            DOMAIN, "set_item", {"item_id": "drinking-water", "revision": 7, "applicable": True,
                "target": 30000, "lots": [{"lot_id": "lot-1", "quantity": 30000, "expires_on": None}],
                "confirm": True, "apply_date_defaults": True}, blocking=True, return_response=True, context=context,
        )
        household = await restarted.services.async_call(
            DOMAIN, "get_inventory", {}, blocking=True, return_response=True, context=context,
        )
        assert household["revision"] == reminder["revision"]
        water_lot = household["items"]["drinking-water"]["lots"][0]
        assert water_lot["received_on"] == today.isoformat()
        assert water_lot["expires_on"] is None
        assert water_lot["label_check_on"] == (today + timedelta(days=7)).isoformat()
        assert household["summary"]["items"]["drinking-water"]["usable"] == 0
        future = (today + timedelta(days=90)).isoformat()
        revision = household["revision"]
        for item in household["catalog"]:
            item_id = item["id"]
            target = 30000 if item_id == "drinking-water" else 1
            lot = {"lot_id": "lot-1", "quantity": target, "expires_on": future if item["date_kind"] == "expiry" else None}
            if item_id == "drinking-water":
                lot.update(bottle_ml=2000, bottle_count=15)
            result = await restarted.services.async_call(
                DOMAIN, "set_item", {"item_id": item_id, "revision": revision, "applicable": True,
                    "target": target, "lots": [lot], "confirm": True, "apply_date_defaults": True},
                blocking=True, return_response=True, context=context,
            )
            revision = result["revision"]
        stocked = await restarted.services.async_call(
            DOMAIN, "get_inventory", {}, blocking=True, return_response=True, context=context,
        )
        assert len(stocked["items"]) == len(stocked["catalog"]) == len(CATALOG_ITEMS)
        assert all(status["state"] == "sufficient" for status in stocked["summary"]["items"].values())
        assert all(record["verified_on"] == today.isoformat() and record["lots"][0]["received_on"] == today.isoformat()
                   for record in stocked["items"].values())
        # Dashboard gear dialog: display settings and inspection interval change without a reload.
        live_entry = restarted.config_entries.async_get_entry(entry.entry_id)
        live_inventory = live_entry.runtime_data
        shown = await restarted.services.async_call(
            DOMAIN, "set_display", {"revision": stocked["revision"], "title": "민준이네 비상창고",
                                    "nickname": "민준이네", "show_survival": False},
            blocking=True, return_response=True, context=context,
        )
        assert shown["revision"] == stocked["revision"] + 1
        for bad in ({"title": "<script>"}, {"show_rank": "no"}, {"title": "가" * 31}):
            try:
                await restarted.services.async_call(
                    DOMAIN, "set_display", {"revision": shown["revision"], **bad},
                    blocking=True, return_response=True, context=context,
                )
            except (HomeAssistantError, vol.Invalid):
                pass
            else:
                raise AssertionError(f"accepted bad display setting {bad}")
        viewer = await restarted.auth.async_create_user("Viewer")
        for service, data in (("set_display", {"revision": shown["revision"], "show_rank": False}),
                              ("set_inspection_days", {"inspection_days": 30})):
            try:
                await restarted.services.async_call(DOMAIN, service, data, blocking=True,
                                                    return_response=True, context=Context(user_id=viewer.id))
            except Unauthorized:
                pass
            else:
                raise AssertionError(f"non-admin could call {service}")
        await restarted.services.async_call(
            DOMAIN, "set_inspection_days", {"inspection_days": 120},
            blocking=True, return_response=True, context=context,
        )
        await restarted.async_block_till_done()
        for bad_days in (6, 366):
            try:
                await restarted.services.async_call(
                    DOMAIN, "set_inspection_days", {"inspection_days": bad_days},
                    blocking=True, return_response=True, context=context,
                )
            except vol.Invalid:
                pass
            else:
                raise AssertionError(f"accepted inspection interval {bad_days}")
        assert live_entry.runtime_data is live_inventory, "inspection change must not reload the entry"
        settings = await restarted.services.async_call(
            DOMAIN, "get_inventory", {}, blocking=True, return_response=True, context=context,
        )
        assert settings["default_review_interval_days"] == 120
        assert settings["display"]["title"] == "민준이네 비상창고"
        assert settings["display"]["show_survival"] is False and settings["display"]["show_rank"] is True
        assert settings["mqtt_enabled"] is False
        # Settings > Integrations > gear (options flow) changes the same values after setup.
        options = await restarted.config_entries.options.async_init(entry.entry_id)
        assert options["type"] == "form", options
        assert options["data_schema"]({}) == {"household_size": 5, "inspection_days": 120, "mqtt_enabled": False}
        try:
            options["data_schema"]({"household_size": 100})
        except vol.Invalid:
            pass
        else:
            raise AssertionError("options accepted 100 people")
        done = await restarted.config_entries.options.async_configure(
            options["flow_id"], {"household_size": 6, "inspection_days": 60, "mqtt_enabled": False},
        )
        assert done["type"] == "create_entry", done
        await restarted.async_block_till_done()
        assert live_entry.runtime_data is live_inventory, "non-MQTT options must not reload the entry"
        assert live_inventory.snapshot["household_size"] == 6
        assert live_entry.options["inspection_days"] == 60 and live_entry.options["mqtt_enabled"] is False
        after_options = await restarted.services.async_call(
            DOMAIN, "get_inventory", {}, blocking=True, return_response=True, context=context,
        )
        assert after_options["default_review_interval_days"] == 60
        assert after_options["summary"]["items"]["drinking-water"]["recommended_target"] == 36000
        await restarted.async_stop()
        final_ha = await start_ha(config_dir)
        final_entry = final_ha.config_entries.async_get_entry(entry.entry_id)
        assert final_entry.runtime_data.snapshot["household_size"] == 6
        assert final_entry.runtime_data.snapshot["display"]["nickname"] == "민준이네"
        assert final_entry.options["inspection_days"] == 60
        assert final_entry.runtime_data.snapshot["items"] == stocked["items"]
        assert await final_ha.config_entries.async_unload(entry.entry_id)
        assert "kr-survival-kit" not in final_ha.data[frontend.DATA_PANELS]
        frontend.async_register_built_in_panel(final_ha, "lovelace", frontend_url_path="kr-survival-kit")
        existing_panel = final_ha.data[frontend.DATA_PANELS]["kr-survival-kit"]
        assert await final_ha.config_entries.async_setup(entry.entry_id)
        assert await final_ha.config_entries.async_unload(entry.entry_id)
        assert final_ha.data[frontend.DATA_PANELS]["kr-survival-kit"] is existing_panel
        await final_ha.async_stop()
        print(json.dumps({"ha_core": version("homeassistant"), "entry": "created_and_restarted", "sensors": 3,
                          "saved_revision": revision, "fully_stocked_items": len(stocked["items"]), "household": "4_to_5_and_restored", "stale_revision": "rejected", "save_failure": "rejected",
                          "viewer": "read_write_rejected", "boolean_input": "rejected",
                          "ration": "added_edited_deleted", "water_litre_roundtrip": "3251ml_after_restart",
                          "concurrent_edit": "one_rejected", "received_on": "roundtrip",
                          "review_interval_days": "roundtrip_and_invalid_rejected"}))


if __name__ == "__main__":
    asyncio.run(main())
