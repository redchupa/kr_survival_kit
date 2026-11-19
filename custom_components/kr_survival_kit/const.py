"""Shared integration identifiers."""

DOMAIN = "kr_survival_kit"
PLATFORMS = ["sensor"]

DEFAULT_INSPECTION_DAYS = 90
MIN_INSPECTION_DAYS = 7
MAX_INSPECTION_DAYS = 365
MIN_HOUSEHOLD_SIZE = 1
MAX_HOUSEHOLD_SIZE = 99
MQTT_OPTION_KEYS = ("mqtt_enabled", "mqtt_cleanup_pending")


def entry_inspection_days(entry):
    """Default inspection interval: a later change in options wins over the first setup."""
    days = entry.options.get("inspection_days", entry.data.get("inspection_days", DEFAULT_INSPECTION_DAYS))
    return days if type(days) is int and days >= 1 else DEFAULT_INSPECTION_DAYS
