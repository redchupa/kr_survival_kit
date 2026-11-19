"""KR Survival Kit local inventory integration."""

import json
from copy import deepcopy
from pathlib import Path

import voluptuous as vol

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import SupportsResponse
from homeassistant.exceptions import ConfigEntryError, HomeAssistantError, Unauthorized
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN, MAX_INSPECTION_DAYS, MIN_INSPECTION_DAYS, MQTT_OPTION_KEYS, PLATFORMS, entry_inspection_days
from .dashboard import async_register_dashboard
from .inventory import CUSTOM_UNITS, DATE_LABELS, DEFAULT_HOUSEHOLD_SIZE, LABEL_CHECK_DAYS, MAX_AMOUNT, MAX_REVIEW_DAYS, Inventory, InventoryError, RevisionConflict, display_settings, summarize
from .mqtt_publish import MqttPublisher, async_remove_discovery


def _lot(value):
    if not isinstance(value, dict):
        raise vol.Invalid("lot must be an object")
    return value


def _nonnegative_int(value):
    if type(value) is not int or not 0 <= value <= MAX_AMOUNT:
        raise vol.Invalid("Expected an integer from 0 to 1000000000")
    return value


def _review_interval(value):
    if value is not None and (type(value) is not int or not 1 <= value <= MAX_REVIEW_DAYS):
        raise vol.Invalid("Expected review interval from 1 to 3650 days or null")
    return value


SET_SCHEMA = vol.Schema({
    vol.Optional("entry_id"): str,
    vol.Required("item_id"): vol.All(str, vol.Length(min=1, max=80)),
    vol.Required("revision"): _nonnegative_int,
    vol.Required("applicable"): bool,
    vol.Required("target"): vol.Any(None, _nonnegative_int),
    vol.Required("lots"): vol.All([_lot], vol.Length(max=200)),
    vol.Required("confirm"): bool,
    vol.Optional("apply_date_defaults", default=False): bool,
    vol.Optional("review_interval_days"): _review_interval,
    vol.Optional("verified_on"): vol.Any(None, vol.All(str, vol.Length(max=10))),
})
DELETE_SCHEMA = vol.Schema({
    vol.Optional("entry_id"): str,
    vol.Required("item_id"): vol.All(str, vol.Length(min=1, max=80)),
    vol.Required("revision"): _nonnegative_int,
})
HOUSEHOLD_SCHEMA = vol.Schema({
    vol.Optional("entry_id"): str,
    vol.Required("revision"): _nonnegative_int,
    vol.Required("household_size"): vol.All(_nonnegative_int, vol.Range(min=1, max=99)),
})
GET_SCHEMA = vol.Schema({vol.Optional("entry_id"): str})
ADD_CUSTOM_SCHEMA = vol.Schema({
    vol.Optional("entry_id"): str,
    vol.Required("revision"): _nonnegative_int,
    vol.Required("name"): vol.All(str, vol.Length(min=1, max=40)),
    vol.Required("unit"): vol.In(CUSTOM_UNITS),
    vol.Required("date_kind"): vol.In(("expiry", "inspection")),
    vol.Optional("date_label"): vol.Any(None, vol.In(DATE_LABELS)),
})
REMOVE_CUSTOM_SCHEMA = vol.Schema({
    vol.Optional("entry_id"): str,
    vol.Required("revision"): _nonnegative_int,
    vol.Required("item_id"): vol.All(str, vol.Length(min=1, max=20)),
})
DISPLAY_SCHEMA = vol.Schema({
    vol.Optional("entry_id"): str,
    vol.Required("revision"): _nonnegative_int,
    vol.Optional("title"): vol.All(str, vol.Length(max=30)),
    vol.Optional("nickname"): vol.All(str, vol.Length(max=20)),
    vol.Optional("show_survival"): bool,
    vol.Optional("show_clock"): bool,
    vol.Optional("show_rank"): bool,
    vol.Optional("show_missions"): bool,
    vol.Optional("show_expiring"): bool,
})
INSPECTION_SCHEMA = vol.Schema({
    vol.Optional("entry_id"): str,
    vol.Required("inspection_days"): vol.All(_nonnegative_int, vol.Range(min=MIN_INSPECTION_DAYS, max=MAX_INSPECTION_DAYS)),
})
SERVICES = ("set_item", "delete_item", "set_household_size", "get_inventory", "add_custom_item", "remove_custom_item",
            "set_display", "set_inspection_days")


async def async_setup_entry(hass, entry):
    """Load the private snapshot before creating sensors."""
    try:
        catalog_data, household, guide, quiz = await hass.async_add_executor_job(_load_content)
    except (OSError, ValueError) as error:
        raise ConfigEntryError(
            f"설치 자료를 읽을 수 없습니다 ({error}). 전체 통합 폴더를 다시 설치하고 Home Assistant를 재시작하세요."
        ) from error
    catalog = catalog_data["items"]
    store = Store(
        hass, 1, f"{DOMAIN}_{entry.entry_id}", private=True, atomic_writes=True
    )
    inventory = Inventory(store, catalog, entry.data.get("household_size", DEFAULT_HOUSEHOLD_SIZE))
    inventory.household = household
    await inventory.load()
    inventory.mqtt_options = {key: entry.options.get(key, False) for key in MQTT_OPTION_KEYS}
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
            DOMAIN, "set_household_size", _set_household_size(hass), schema=HOUSEHOLD_SCHEMA,
            supports_response=SupportsResponse.OPTIONAL,
        )
        hass.services.async_register(
            DOMAIN, "get_inventory", _get_inventory(hass), schema=GET_SCHEMA,
            supports_response=SupportsResponse.ONLY,
        )
        hass.services.async_register(
            DOMAIN, "add_custom_item", _add_custom_item(hass), schema=ADD_CUSTOM_SCHEMA,
            supports_response=SupportsResponse.OPTIONAL,
        )
        hass.services.async_register(
            DOMAIN, "remove_custom_item", _remove_custom_item(hass), schema=REMOVE_CUSTOM_SCHEMA,
            supports_response=SupportsResponse.OPTIONAL,
        )
        hass.services.async_register(
            DOMAIN, "set_display", _set_display(hass), schema=DISPLAY_SCHEMA,
            supports_response=SupportsResponse.OPTIONAL,
        )
        hass.services.async_register(
            DOMAIN, "set_inspection_days", _set_inspection_days(hass), schema=INSPECTION_SCHEMA,
            supports_response=SupportsResponse.OPTIONAL,
        )
    await async_register_dashboard(hass, entry, household, guide, quiz)
    return True


async def async_unload_entry(hass, entry):
    """Unload sensors and actions."""
    publisher = hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    if publisher is not None:
        await publisher.close()
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        for service in SERVICES:
            hass.services.async_remove(DOMAIN, service)
    return unloaded


async def _options_updated(hass, entry):
    """Reload only when MQTT publishing changes; other options take effect immediately."""
    inventory = getattr(entry, "runtime_data", None)
    current = {key: entry.options.get(key, False) for key in MQTT_OPTION_KEYS}
    if isinstance(inventory, Inventory) and getattr(inventory, "mqtt_options", None) == current:
        for listener in tuple(inventory.listeners):
            listener()
        return
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
    # An unloaded entry may still carry a stale runtime_data object; only a loaded entry may be written.
    if (entry is None or entry.domain != DOMAIN or entry.state is not ConfigEntryState.LOADED
            or not isinstance(getattr(entry, "runtime_data", None), Inventory)):
        raise HomeAssistantError("KR Survival Kit entry is unavailable")
    return entry.runtime_data, entry


def _write_errors(error):
    if isinstance(error, OSError):
        return HomeAssistantError("Inventory save failed; previous values are still active")
    return HomeAssistantError(str(error))


def _set_item(hass):
    async def handle(call):
        inventory, _ = await _admin_inventory(hass, call)
        data = call.data
        try:
            revision = await inventory.set_item(
                data["item_id"], data["revision"], data["applicable"],
                data["target"], data["lots"], data["confirm"], dt_util.now().date().isoformat(),
                apply_date_defaults=data["apply_date_defaults"], verified_on=data.get("verified_on"),
                **({"review_interval_days": data["review_interval_days"]} if "review_interval_days" in data else {}),
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


def _set_household_size(hass):
    async def handle(call):
        inventory, _ = await _admin_inventory(hass, call)
        try:
            revision = await inventory.set_household_size(call.data["revision"], call.data["household_size"])
        except InventoryError as error:
            raise HomeAssistantError(str(error)) from error
        except OSError as error:
            raise HomeAssistantError("Inventory save failed; previous values are still active") from error
        return {"revision": revision}
    return handle


def _add_custom_item(hass):
    async def handle(call):
        inventory, _ = await _admin_inventory(hass, call)
        data = call.data
        try:
            revision, item_id = await inventory.add_custom_item(
                data["revision"], data["name"], data["unit"], data["date_kind"], data.get("date_label"),
            )
        except InventoryError as error:
            raise HomeAssistantError(str(error)) from error
        except OSError as error:
            raise HomeAssistantError("Inventory save failed; previous values are still active") from error
        return {"revision": revision, "item_id": item_id}
    return handle


def _remove_custom_item(hass):
    async def handle(call):
        inventory, _ = await _admin_inventory(hass, call)
        try:
            revision = await inventory.remove_custom_item(call.data["revision"], call.data["item_id"])
        except InventoryError as error:
            raise HomeAssistantError(str(error)) from error
        except OSError as error:
            raise HomeAssistantError("Inventory save failed; previous values are still active") from error
        return {"revision": revision}
    return handle


def _set_display(hass):
    async def handle(call):
        inventory, _ = await _admin_inventory(hass, call)
        changes = {key: value for key, value in call.data.items() if key not in ("entry_id", "revision")}
        try:
            revision = await inventory.set_display(call.data["revision"], changes)
        except (InventoryError, OSError) as error:
            raise _write_errors(error) from error
        return {"revision": revision}
    return handle


def _set_inspection_days(hass):
    async def handle(call):
        inventory, entry = await _admin_inventory(hass, call)
        days = call.data["inspection_days"]
        if entry_inspection_days(entry) != days:
            hass.config_entries.async_update_entry(entry, options={**entry.options, "inspection_days": days})
        return {"inspection_days": days, "revision": inventory.snapshot["revision"]}
    return handle


def _get_inventory(hass):
    async def handle(call):
        inventory, entry = await _admin_inventory(hass, call)
        inspection_days = entry_inspection_days(entry)
        snapshot = deepcopy(inventory.snapshot)
        today = dt_util.now().date()
        snapshot["today"] = today.isoformat()
        snapshot["label_check_days"] = LABEL_CHECK_DAYS
        snapshot["summary"] = summarize(
            inventory.catalog.values(), snapshot["items"],
            today, inspection_days, household_size=snapshot["household_size"],
        )
        snapshot["catalog"] = deepcopy(list(inventory.catalog.values()))
        snapshot["household"] = deepcopy(inventory.household)
        snapshot["default_review_interval_days"] = inspection_days
        snapshot["display"] = display_settings(snapshot.get("display"))
        snapshot["mqtt_enabled"] = bool(entry.options.get("mqtt_enabled", False))
        return snapshot
    return handle


def _load_content():
    """Read bundled public content outside Home Assistant's event loop."""
    content_path = Path(__file__).parent / "content"
    return tuple(
        json.loads((content_path / name).read_text(encoding="utf-8"))
        for name in ("catalog.ko.json", "household.ko.json", "guide.ko.json", "quiz.ko.json")
    )
