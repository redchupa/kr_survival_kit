"""Set up a local KR Survival Kit household."""

import voluptuous as vol

from homeassistant import config_entries

from .const import DOMAIN


class KrSurvivalKitConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Single local inventory."""

    VERSION = 1

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
