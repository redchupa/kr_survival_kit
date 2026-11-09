"""Set up a local KR Survival Kit household."""

import voluptuous as vol

from homeassistant import config_entries

from .const import DOMAIN


class KrSurvivalKitConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Single local inventory."""

    VERSION = 1

    @staticmethod
    def async_get_options_flow(config_entry):
        return KrSurvivalKitOptionsFlow(config_entry)

    async def async_step_user(self, user_input=None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="KR Survival Kit", data=user_input)
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {vol.Required("inspection_days", default=30): vol.All(vol.Coerce(int), vol.Range(min=1, max=365))}
            ),
        )


class KrSurvivalKitOptionsFlow(config_entries.OptionsFlow):
    """Opt in to publishing aggregate MQTT sensors."""

    def __init__(self, config_entry):
        self._saved_options = dict(config_entry.options)

    async def async_step_init(self, user_input=None):
        if user_input is not None:
            enabled = user_input["mqtt_enabled"]
            pending = not enabled and self._saved_options.get("mqtt_enabled", False)
            return self.async_create_entry(data={
                "mqtt_enabled": enabled,
                "mqtt_cleanup_pending": not enabled and (
                    pending or self._saved_options.get("mqtt_cleanup_pending", False)
                ),
            })
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required("mqtt_enabled", default=self._saved_options.get("mqtt_enabled", False)): bool
            }),
        )
