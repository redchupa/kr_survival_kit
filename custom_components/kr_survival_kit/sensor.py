"""Three local aggregate sensors."""

from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util

from .const import DOMAIN, entry_inspection_days
from .inventory import summarize

METRICS = {
    "shortage_count": "부족한 품목",
    "needs_check_count": "확인할 품목",
    "expiring_count": "기한 임박 품목",
}


async def async_setup_entry(hass, entry, async_add_entities):
    inventory = entry.runtime_data
    async_add_entities(
        [InventoryCountSensor(entry, inventory, metric) for metric in METRICS]
    )


class InventoryCountSensor(SensorEntity):
    """Count from the same local snapshot."""

    _attr_native_unit_of_measurement = "개"
    _attr_icon = "mdi:clipboard-check-outline"

    def __init__(self, entry, inventory, metric):
        self._entry = entry
        self._inventory = inventory
        self._metric = metric
        self._attr_name = METRICS[metric]
        self._attr_unique_id = f"{entry.entry_id}_{metric}"
        # Stable, ASCII entity ids for new installs (the Korean names would be transliterated).
        # Existing installs keep whatever id the entity registry already holds.
        self.entity_id = f"sensor.{DOMAIN}_{metric}"

    @property
    def native_value(self):
        return summarize(
            self._inventory.catalog.values(),
            self._inventory.snapshot["items"],
            dt_util.now().date(),
            entry_inspection_days(self._entry),
            household_size=self._inventory.snapshot["household_size"],
        )[self._metric]

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        self._inventory.listeners.append(self.async_write_ha_state)
        self.async_on_remove(
            lambda: self._inventory.listeners.remove(self.async_write_ha_state)
        )

        async def refresh_at_midnight(_now):
            self.async_write_ha_state()

        self.async_on_remove(
            async_track_time_change(
                self.hass, refresh_at_midnight, hour=0, minute=0, second=1
            )
        )
