"""Set up a local KR Survival Kit household."""

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.config_entries import ConfigEntryState
from homeassistant.helpers.selector import NumberSelector, NumberSelectorConfig, NumberSelectorMode

from . import _load_content
from .const import (
    DEFAULT_INSPECTION_DAYS, DOMAIN, MAX_HOUSEHOLD_SIZE, MAX_INSPECTION_DAYS, MIN_HOUSEHOLD_SIZE,
    MIN_INSPECTION_DAYS, entry_inspection_days,
)
from .inventory import DEFAULT_HOUSEHOLD_SIZE, Inventory, InventoryError


class _WholeNumberBox(NumberSelector):
    """Number box that also rejects fractions such as 2.5 and returns an int."""

    def __call__(self, data):
        value = super().__call__(data)
        if not float(value).is_integer():
            raise vol.Invalid("whole number required")
        return int(value)


def _number_box(minimum, maximum, unit):
    """Typed number box (not a slider); bounds are enforced again on the server."""
    return vol.All(
        _WholeNumberBox(NumberSelectorConfig(
            min=minimum, max=maximum, step=1, mode=NumberSelectorMode.BOX, unit_of_measurement=unit,
        )),
        vol.Range(min=minimum, max=maximum),
    )


class KrSurvivalKitConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Single local inventory."""

    VERSION = 1

    @staticmethod
    def async_get_options_flow(config_entry):
        return KrSurvivalKitOptionsFlow(config_entry)

    async def async_step_user(self, user_input=None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        try:
            await self.hass.async_add_executor_job(_load_content)
        except (OSError, ValueError):
            return self.async_abort(reason="incomplete_install")
        if user_input is not None:
            return self.async_create_entry(title="KR Survival Kit", data=user_input)
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required("household_size", default=DEFAULT_HOUSEHOLD_SIZE): _number_box(
                        MIN_HOUSEHOLD_SIZE, MAX_HOUSEHOLD_SIZE, "명"),
                    vol.Required("inspection_days", default=DEFAULT_INSPECTION_DAYS): _number_box(
                        MIN_INSPECTION_DAYS, MAX_INSPECTION_DAYS, "일"),
                }
            ),
        )


class KrSurvivalKitOptionsFlow(config_entries.OptionsFlow):
    """Change household size, default inspection interval and MQTT after setup."""

    def __init__(self, config_entry):
        self._entry = config_entry
        self._saved_options = dict(config_entry.options)

    def _inventory(self):
        inventory = getattr(self._entry, "runtime_data", None)
        if self._entry.state is not ConfigEntryState.LOADED or not isinstance(inventory, Inventory):
            return None
        return inventory

    async def async_step_init(self, user_input=None):
        inventory = self._inventory()
        if inventory is None:
            return self.async_abort(reason="not_loaded")
        errors = {}
        if user_input is not None:
            people = user_input["household_size"]
            try:
                if people != inventory.snapshot["household_size"]:
                    await inventory.set_household_size(inventory.snapshot["revision"], people)
            except (InventoryError, OSError):
                errors["base"] = "save_failed"
            else:
                enabled = user_input["mqtt_enabled"]
                pending = not enabled and self._saved_options.get("mqtt_enabled", False)
                return self.async_create_entry(data={
                    **{key: value for key, value in self._saved_options.items()
                       if key not in ("mqtt_enabled", "mqtt_cleanup_pending", "inspection_days")},
                    "inspection_days": user_input["inspection_days"],
                    "mqtt_enabled": enabled,
                    "mqtt_cleanup_pending": not enabled and (
                        pending or self._saved_options.get("mqtt_cleanup_pending", False)
                    ),
                })
        current = user_input or {
            "household_size": inventory.snapshot["household_size"],
            "inspection_days": entry_inspection_days(self._entry),
            "mqtt_enabled": self._saved_options.get("mqtt_enabled", False),
        }
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required("household_size", default=current["household_size"]): _number_box(
                    MIN_HOUSEHOLD_SIZE, MAX_HOUSEHOLD_SIZE, "명"),
                vol.Required("inspection_days", default=current["inspection_days"]): _number_box(
                    MIN_INSPECTION_DAYS, MAX_INSPECTION_DAYS, "일"),
                vol.Required("mqtt_enabled", default=current["mqtt_enabled"]): bool,
            }),
            errors=errors,
        )
