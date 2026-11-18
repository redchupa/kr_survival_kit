"""Register a Home Assistant sidebar panel backed by the bundled public assets."""

from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.loader import async_get_integration

from .const import DOMAIN

PANEL_PATH = "kr-survival-kit"
ASSET_PATH = "/kr_survival_kit_assets"


async def async_register_dashboard(hass, entry, household, guide, quiz):
    """Expose the panel while the integration is loaded."""
    if PANEL_PATH in hass.data.get(frontend.DATA_PANELS, {}):
        return

    data = hass.data.setdefault(DOMAIN, {})
    if not data.get("static_registered"):
        await hass.http.async_register_static_paths([
            StaticPathConfig(ASSET_PATH, str(Path(__file__).parent / "www"), False),
        ])
        data["static_registered"] = True

    integration = await async_get_integration(hass, DOMAIN)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="kr-survival-kit-panel",
        sidebar_title="KR Survival Kit",
        sidebar_icon="mdi:shield-home",
        module_url=f"{ASSET_PATH}/kr-survival-kit-card.js?v={integration.version}",
        require_admin=True,
        config={
            "guide": {**guide, "household_summary": household["compact_summary"]},
            "quiz": quiz,
            "asset_path": ASSET_PATH,
        },
    )
    entry.async_on_unload(lambda: frontend.async_remove_panel(hass, PANEL_PATH))
