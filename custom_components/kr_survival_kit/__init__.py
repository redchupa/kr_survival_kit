"""KR Survival Kit local inventory integration."""

import json
from copy import deepcopy
from pathlib import Path

import voluptuous as vol

from homeassistant.core import SupportsResponse
from homeassistant.exceptions import HomeAssistantError, Unauthorized
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN, PLATFORMS
from .inventory import MAX_AMOUNT, Inventory, InventoryError, RevisionConflict, summarize
from .mqtt_publish import MqttPublisher, async_remove_discovery


def _lot(value):
    if not isinstance(value, dict):
        raise vol.Invalid("lot must be an object")
    return value


def _nonnegative_int(value):
    if type(value) is not int or not 0 <= value <= MAX_AMOUNT:
        raise vol.Invalid("Expected an integer from 0 to 1000000000")
    return value


SET_SCHEMA = vol.Schema({
    vol.Optional("entry_id"): str,
    vol.Required("item_id"): str,
    vol.Required("revision"): _nonnegative_int,
    vol.Required("applicable"): bool,
    vol.Required("target"): vol.Any(None, _nonnegative_int),
    vol.Required("lots"): [_lot],
    vol.Required("confirm"): bool,
})
DELETE_SCHEMA = vol.Schema({
    vol.Optional("entry_id"): str,
    vol.Required("item_id"): str,
    vol.Required("revision"): _nonnegative_int,
})
GET_SCHEMA = vol.Schema({vol.Optional("entry_id"): str})


async def async_setup_entry(hass, entry):
    """Load the private snapshot before creating sensors."""
    content_path = Path(__file__).parent / "content"
    catalog_data, household = await hass.async_add_executor_job(
        _load_content, content_path
    )
    catalog = catalog_data["items"]
    store = Store(
        hass, 1, f"{DOMAIN}_{entry.entry_id}", private=True, atomic_writes=True
    )
    inventory = Inventory(store, catalog)
    inventory.household = household
    await inventory.load()
    entry.runtime_data = inventory
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_options_updated))
    if entry.options.get("mqtt_enabled", False) or entry.options.get("mqtt_cleanup_pending", False):
        publisher = MqttPublisher(hass, entry, inventory)
        hass.data.setdefault(DOMAIN, {})[entry.entry_id] = publisher
        publisher.start()
    if not hass.services.has_service(DOMAIN, "set_item"):
        hass.services.async_register(
            DOMAIN, "set_item", _set_item(hass), schema=SET_SCHEMA,
            supports_response=SupportsResponse.OPTIONAL,
        )
        hass.services.async_register(
            DOMAIN, "delete_item", _delete_item(hass), schema=DELETE_SCHEMA,
            supports_response=SupportsResponse.OPTIONAL,
        )
        hass.services.async_register(
            DOMAIN, "get_inventory", _get_inventory(hass), schema=GET_SCHEMA,
            supports_response=SupportsResponse.ONLY,
        )
    return True


async def async_unload_entry(hass, entry):
    """Unload sensors and actions."""
    publisher = hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    if publisher is not None:
        await publisher.close()
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        for service in ("set_item", "delete_item", "get_inventory"):
            hass.services.async_remove(DOMAIN, service)
    return unloaded


async def _options_updated(hass, entry):
    await hass.config_entries.async_reload(entry.entry_id)


async def async_remove_entry(hass, entry):
    if entry.options.get("mqtt_enabled", False) or entry.options.get("mqtt_cleanup_pending", False):
        await async_remove_discovery(hass, entry)


async def _admin_inventory(hass, call):
    user_id = call.context.user_id
    user = await hass.auth.async_get_user(user_id) if user_id else None
    if user is None or not user.is_admin:
        raise Unauthorized(context=call.context)
    entry_id = call.data.get("entry_id")
    if entry_id is None:
        entries = hass.config_entries.async_entries(DOMAIN)
        entry = entries[0] if len(entries) == 1 else None
    else:
        entry = hass.config_entries.async_get_entry(entry_id)
    if entry is None or entry.domain != DOMAIN or entry.runtime_data is None:
        raise HomeAssistantError("KR Survival Kit entry is unavailable")
    return entry.runtime_data, entry.data["inspection_days"]


def _set_item(hass):
    async def handle(call):
        inventory, _ = await _admin_inventory(hass, call)
        data = call.data
        try:
            revision = await inventory.set_item(
                data["item_id"], data["revision"], data["applicable"],
                data["target"], data["lots"], data["confirm"], dt_util.now().date().isoformat(),
            )
        except RevisionConflict as error:
            raise HomeAssistantError(str(error)) from error
        except InventoryError as error:
            raise HomeAssistantError(str(error)) from error
        except OSError as error:
            raise HomeAssistantError("Inventory save failed; previous values are still active") from error
        return {"revision": revision}
    return handle


def _delete_item(hass):
    async def handle(call):
        inventory, _ = await _admin_inventory(hass, call)
        try:
            revision = await inventory.delete_item(call.data["item_id"], call.data["revision"])
        except InventoryError as error:
            raise HomeAssistantError(str(error)) from error
        except OSError as error:
            raise HomeAssistantError("Inventory save failed; previous values are still active") from error
        return {"revision": revision}
    return handle


def _get_inventory(hass):
    async def handle(call):
        inventory, inspection_days = await _admin_inventory(hass, call)
        snapshot = deepcopy(inventory.snapshot)
        snapshot["summary"] = summarize(
            inventory.catalog.values(), snapshot["items"],
            dt_util.now().date(), inspection_days,
        )
        snapshot["catalog"] = deepcopy(list(inventory.catalog.values()))
        snapshot["household"] = deepcopy(inventory.household)
        return snapshot
    return handle


def _load_content(content_path):
    """Read bundled public content outside Home Assistant's event loop."""
    return tuple(
        json.loads((content_path / name).read_text(encoding="utf-8"))
        for name in ("catalog.ko.json", "household.ko.json")
    )
