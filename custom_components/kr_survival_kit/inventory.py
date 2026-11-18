"""Inventory rules and durable, revision-checked updates."""

import asyncio
from copy import deepcopy
from datetime import date, timedelta


class InventoryError(ValueError):
    """Invalid inventory input."""


class RevisionConflict(InventoryError):
    """Another edit was saved first."""


MAX_AMOUNT = 1_000_000_000
MAX_REVIEW_DAYS = 3650
MAX_LOCATION_LENGTH = 60
MAX_CUSTOM_ITEMS = 100
MAX_CUSTOM_NAME_LENGTH = 40
# Free text is shown inside HTML; markup and quoting characters are refused at the source
# (the card escapes on output as well, so this is defence in depth).
FORBIDDEN_TEXT_CHARS = frozenset("<>\"'`&\\")
CUSTOM_UNITS = ("개", "병", "팩", "통", "박스", "세트", "켤레", "장", "롤", "kg")
DATE_LABELS = ("유통기한", "소비기한", "사용기한", "사용 권장기한")
CUSTOM_ID_PREFIX = "custom-"
LOT_KEYS = {"lot_id", "quantity", "expires_on", "received_on", "bottle_ml", "bottle_count", "label_check_on", "location"}
DEFAULT_HOUSEHOLD_SIZE = 4
_UNSET = object()


# Housekeeping reminders to read the package, never estimated expiration dates.
LABEL_CHECK_DAYS = {
    "drinking-water": 7, "shelf-stable-meal": 3, "canned-food": 7,
    "instant-rice": 7, "cup-noodles": 7, "canned-pupa": 14, "canned-whelk": 14, "canned-fruit": 14,
    "otc-medicine": 7, "butane-canister": 7, "self-heating-ration": 3, "hand-warmers": 14,
    "solid-fuel": 7, "long-storage-snacks": 3, "infant-formula": 1,
    "ready-to-feed-formula": 1, "masks": 14, "rice": 7,
    "spam-canned-ham": 14, "canned-tuna": 14, "honey-gift-set": 14,
    "water-purification-tablets": 7, "toilet-coagulant": 14, "gas-mask-filter": 3,
    "batteries": 14, "batteries-aaa": 14, "batteries-special": 14, "first-aid-kit": 14,
    "wet-wipes": 14, "water-sanitation-kit": 14, "prescription-preparedness": 7, "infant-supplies": 3,
    "portable-water-filter": 14, "digestive-medicine": 7, "cold-medicine": 7, "antidiarrheal": 7,
    "wound-ointment": 7, "sterile-gauze": 14, "adhesive-bandages": 14, "batteries-c": 14, "batteries-d": 14,
    "mouthwash": 14, "infant-medicine": 3,
}


def _date(value):
    try:
        parsed = date.fromisoformat(value)
        if not isinstance(value, str) or parsed.isoformat() != value:
            raise ValueError("Date must use YYYY-MM-DD")
        return parsed
    except (TypeError, ValueError) as error:
        raise InventoryError("Invalid ISO date") from error


def clean_text(value):
    """Best-effort repair for stored text written before character filtering existed."""
    text = "".join(" " if ord(char) < 32 or ord(char) == 127 else char for char in str(value))
    text = "".join(char for char in text if char not in FORBIDDEN_TEXT_CHARS)
    return " ".join(text.split())


def safe_text(value, max_length):
    """True for trimmed single-line text without markup characters."""
    return (isinstance(value, str) and 0 < len(value) <= max_length and value == value.strip()
            and not any(ord(char) < 32 or ord(char) == 127 or char in FORBIDDEN_TEXT_CHARS for char in value))


def custom_catalog_item(item_id, definition):
    """Catalog entry for a user-added item; it behaves like an optional item."""
    entry = {
        "id": item_id, "name": definition["name"], "tier": "optional", "unit": definition["unit"],
        "date_kind": definition["date_kind"], "source_ids": [], "note": "직접 추가한 물품입니다.", "custom": True,
    }
    if definition.get("date_label"):
        entry["date_label"] = definition["date_label"]
    return entry


def validate_custom(item_id, definition, builtin_ids=()):
    suffix = item_id[len(CUSTOM_ID_PREFIX):] if isinstance(item_id, str) and item_id.startswith(CUSTOM_ID_PREFIX) else ""
    if not suffix.isdigit() or suffix.startswith("0") or len(suffix) > 6 or item_id in builtin_ids:
        raise InventoryError("Invalid custom item id")
    if (not isinstance(definition, dict) or set(definition) - {"name", "unit", "date_kind", "date_label"}
            or not safe_text(definition.get("name"), MAX_CUSTOM_NAME_LENGTH)
            or definition.get("unit") not in CUSTOM_UNITS
            or definition.get("date_kind") not in ("expiry", "inspection")
            or (definition.get("date_label") is not None
                and (definition["date_kind"] != "expiry" or definition["date_label"] not in DATE_LABELS))):
        raise InventoryError("Custom item needs a 1-40 character name without < > \" ' ` & \\, a known unit and date kind")


def _review_days(value):
    if value is not None and (type(value) is not int or not 1 <= value <= MAX_REVIEW_DAYS):
        raise InventoryError("review_interval_days must be an integer from 1 to 3650 or null")


def validate_item(catalog_item, applicable, target, lots):
    if type(applicable) is not bool:
        raise InventoryError("applicable must be a boolean")
    if target is not None and (type(target) is not int or not 0 <= target <= MAX_AMOUNT):
        raise InventoryError("target must be an integer from 0 to 1000000000 or null")
    if not isinstance(lots, list):
        raise InventoryError("lots must be a list")
    if len(lots) > 200:
        raise InventoryError("No more than 200 purchase lots per item")
    seen = set()
    for lot in lots:
        if not isinstance(lot, dict) or not {"lot_id", "quantity", "expires_on"} <= set(lot) or set(lot) - LOT_KEYS:
            raise InventoryError("Each lot needs lot_id, quantity, and expires_on; received_on and location are optional")
        lot_id = lot["lot_id"]
        if (not isinstance(lot_id, str) or not lot_id or len(lot_id) > 80
                or any(ord(char) < 32 or ord(char) == 127 for char in lot_id)
                or lot_id in seen):
            raise InventoryError("lot_id must be unique and nonempty")
        seen.add(lot_id)
        if type(lot["quantity"]) is not int or not 0 <= lot["quantity"] <= MAX_AMOUNT:
            raise InventoryError("quantity must be an integer from 0 to 1000000000")
        # Free-text storage place such as "현관 팬트리" or "주방 팬트리 3층 선반".
        location = lot.get("location")
        if location is not None and not safe_text(location, MAX_LOCATION_LENGTH):
            raise InventoryError("location must be trimmed text of 1 to 60 characters without < > \" ' ` & \\ or null")
        if {"bottle_ml", "bottle_count"} & lot.keys():
            volume, count = lot.get("bottle_ml"), lot.get("bottle_count")
            if (catalog_item["id"] != "drinking-water" or type(volume) is not int
                    or type(count) is not int or not 1 <= volume <= MAX_AMOUNT
                    or not 0 <= count <= MAX_AMOUNT or volume * count != lot["quantity"]):
                raise InventoryError("Invalid water bottle capacity or count")
        if lot.get("received_on") is not None:
            _date(lot["received_on"])
        expiry = lot["expires_on"]
        if "label_check_on" in lot:
            if expiry is not None or catalog_item["date_kind"] != "expiry":
                raise InventoryError("A label check date requires an unknown package date")
            _date(lot["label_check_on"])
        if catalog_item["date_kind"] == "expiry":
            if expiry is not None:
                _date(expiry)
        elif expiry is not None:
            raise InventoryError("Inspection items cannot have expiry dates")


def recommended_targets(people):
    return {"drinking-water": people * 6000, "backpack": people, "blanket": people,
            "flashlight": 2, "first-aid-kit": 1}


def summarize(catalog, records, today, inspection_days=30, expiry_days=30, household_size=None):
    """Return per-item states and three independent counts."""
    today = _date(today) if isinstance(today, str) else today
    results = {}
    counts = {"shortage_count": 0, "needs_check_count": 0, "expiring_count": 0}
    recommended = recommended_targets(household_size) if household_size is not None else {}
    for item in catalog:
        item_id = item["id"]
        record = records.get(item_id)
        if record is None:
            applicable = item["tier"] not in ("household", "optional")
            target = None
            verified_on = None
            confirmed = False
            lots = []
            review_days = inspection_days
        else:
            applicable = record["applicable"]
            target = record["target"]
            verified_on = record["verified_on"]
            confirmed = record.get("confirmed", verified_on is not None)
            lots = record["lots"]
            review_days = record.get("review_interval_days") or inspection_days
        recommended_target = recommended.get(item_id)
        if target is None:
            target = recommended_target
        usable = 0
        unconfirmed = 0
        expiring = 0
        expired = 0
        next_expiry = None
        label_checks = []
        for lot in lots:
            quantity = lot["quantity"]
            expiry = lot["expires_on"]
            if item["date_kind"] == "expiry":
                if expiry is None:
                    if quantity and lot.get("label_check_on"):
                        label_checks.append(lot["label_check_on"])
                    unconfirmed += quantity
                    continue
                expiry_date = _date(expiry)
                if expiry_date < today:
                    expired += quantity
                    continue
                if quantity and (next_expiry is None or expiry_date < next_expiry):
                    next_expiry = expiry_date
                if expiry_date <= today + timedelta(days=expiry_days):
                    expiring += quantity
            usable += quantity
        receipt_dates = [_date(lot["received_on"]) for lot in lots if lot["quantity"] > 0 and lot.get("received_on") is not None]
        review_anchor = _date(verified_on) if verified_on is not None else min(receipt_dates, default=None)
        next_review = review_anchor + timedelta(days=review_days) if review_anchor else None
        stale = not confirmed or verified_on is None or today > next_review
        if not applicable or target == 0:
            state = "not_applicable"
        elif target is None or stale:
            state = "needs_check"
        elif usable >= target:
            state = "sufficient"
        elif usable + unconfirmed >= target:
            state = "needs_check"
        else:
            state = "shortage"
        if state == "shortage":
            counts["shortage_count"] += 1
        elif state == "needs_check":
            counts["needs_check_count"] += 1
        if applicable and expiring:
            counts["expiring_count"] += 1
        results[item_id] = {
            "state": state,
            "usable": usable,
            "unconfirmed": unconfirmed,
            "expiring_quantity": expiring,
            "expired_quantity": expired,
            "unknown_date_quantity": unconfirmed,
            "next_label_check_on": min(label_checks, default=None),
            "next_expiry_on": next_expiry.isoformat() if next_expiry else None,
            "expiry_days_remaining": (next_expiry - today).days if next_expiry else None,
            "review_interval_days": review_days,
            "next_review_on": next_review.isoformat() if next_review else None,
            "review_days_remaining": (next_review - today).days if next_review else None,
            "target": target,
            "recommended_target": recommended_target,
            "verified_on": verified_on,
            "confirmed": confirmed,
            "stale": stale,
        }
    return {"items": results, **counts}


class Inventory:
    """One persisted snapshot per HA config entry."""

    def __init__(self, store, catalog, household_size=DEFAULT_HOUSEHOLD_SIZE):
        self.store = store
        self.builtin = {item["id"]: item for item in catalog}
        self.catalog = dict(self.builtin)
        self.snapshot = {"schema_version": 1, "revision": 0, "items": {}, "household_size": household_size}
        self.lock = asyncio.Lock()
        self.listeners = []

    async def load(self):
        data = await self.store.async_load()
        if data is None:
            return
        if not isinstance(data, dict) or not isinstance(data.get("items"), dict):
            raise InventoryError("Invalid inventory snapshot")
        if data.get("schema_version") != 1:
            raise InventoryError("Unsupported inventory schema")
        if type(data.get("revision")) is not int or data["revision"] < 0:
            raise InventoryError("Invalid inventory revision")
        data = deepcopy(data)
        customs = data.get("custom_items", {})
        if not isinstance(customs, dict) or len(customs) > MAX_CUSTOM_ITEMS:
            raise InventoryError("Invalid custom items")
        for item_id, definition in customs.items():
            if isinstance(definition, dict) and isinstance(definition.get("name"), str):
                definition["name"] = clean_text(definition["name"])[:MAX_CUSTOM_NAME_LENGTH].strip()
            validate_custom(item_id, definition, self.builtin)
        catalog = {**self.builtin, **{item_id: custom_catalog_item(item_id, d) for item_id, d in customs.items()}}
        for record in data["items"].values():
            # Locations saved before markup characters were refused are repaired, never rejected.
            lots = record.get("lots") if isinstance(record, dict) else None
            for lot in lots if isinstance(lots, list) else []:
                if isinstance(lot, dict) and isinstance(lot.get("location"), str):
                    cleaned = clean_text(lot["location"])[:MAX_LOCATION_LENGTH].strip()
                    lot["location"] = cleaned or None
        for item_id, record in data["items"].items():
            if item_id in catalog:
                if (not isinstance(record, dict)
                        or not {"applicable", "target", "lots", "verified_on"} <= record.keys()
                        or type(record.get("confirmed", False)) is not bool):
                    raise InventoryError("Invalid inventory record")
                validate_item(catalog[item_id], record["applicable"], record["target"], record["lots"])
                _review_days(record.get("review_interval_days"))
                if record["verified_on"] is not None:
                    _date(record["verified_on"])
        people = data.get("household_size", self.snapshot["household_size"])
        if type(people) is not int or not 1 <= people <= 99:
            raise InventoryError("Invalid household size")
        self.snapshot = {**data, "household_size": people}
        self.catalog = catalog

    async def set_household_size(self, revision, people):
        if type(revision) is not int or revision < 0:
            raise InventoryError("revision must be a nonnegative integer")
        if type(people) is not int or not 1 <= people <= 99:
            raise InventoryError("household_size must be an integer from 1 to 99")
        async with self.lock:
            if revision != self.snapshot["revision"]:
                raise RevisionConflict("Inventory changed. Refresh and retry.")
            if people == self.snapshot["household_size"]:
                return revision
            candidate = deepcopy(self.snapshot)
            candidate["household_size"] = people
            candidate["revision"] += 1
            await self.store.async_save(candidate)
            self.snapshot = candidate
        for listener in tuple(self.listeners):
            listener()
        return candidate["revision"]

    async def set_item(self, item_id, revision, applicable, target, lots, confirm, today, review_interval_days=_UNSET, *, apply_date_defaults=False, verified_on=None):
        if item_id not in self.catalog:
            raise InventoryError("Unknown item")
        if type(confirm) is not bool:
            raise InventoryError("confirm must be a boolean")
        if type(revision) is not int or revision < 0:
            raise InventoryError("revision must be a nonnegative integer")
        validate_item(self.catalog[item_id], applicable, target, lots)
        if review_interval_days is not _UNSET:
            _review_days(review_interval_days)
        today = _date(today).isoformat()
        if verified_on is not None:
            # Restoring a backup keeps the original inspection day instead of claiming "checked today".
            if not confirm or _date(verified_on).isoformat() > today:
                raise InventoryError("verified_on must be a past or current date and requires confirm")
        if apply_date_defaults:
            lots = deepcopy(lots)
            for lot in lots:
                received_on = lot.get("received_on") or today
                lot["received_on"] = received_on
                if self.catalog[item_id]["date_kind"] == "expiry" and lot["expires_on"] is None:
                    days = LABEL_CHECK_DAYS.get(item_id, 7)
                    anchor = min(_date(received_on), _date(today))
                    lot["label_check_on"] = (anchor + timedelta(days=days)).isoformat()
        async with self.lock:
            if revision != self.snapshot["revision"]:
                raise RevisionConflict("Inventory changed. Refresh and retry.")
            candidate = deepcopy(self.snapshot)
            candidate["revision"] += 1
            previous = candidate["items"].get(item_id, {})
            updated = {
                "applicable": applicable,
                "target": target,
                "verified_on": (verified_on or today) if confirm else previous.get("verified_on"),
                "confirmed": confirm,
                "lots": deepcopy(lots),
            }
            effective_review_days = previous.get("review_interval_days") if review_interval_days is _UNSET else review_interval_days
            if effective_review_days is not None:
                updated["review_interval_days"] = effective_review_days
            candidate["items"][item_id] = updated
            await self.store.async_save(candidate)
            self.snapshot = candidate
        for listener in tuple(self.listeners):
            listener()
        return candidate["revision"]

    async def delete_item(self, item_id, revision):
        if item_id not in self.catalog:
            raise InventoryError("Unknown item")
        if type(revision) is not int or revision < 0:
            raise InventoryError("revision must be a nonnegative integer")
        async with self.lock:
            if revision != self.snapshot["revision"]:
                raise RevisionConflict("Inventory changed. Refresh and retry.")
            candidate = deepcopy(self.snapshot)
            candidate["revision"] += 1
            candidate["items"].pop(item_id, None)
            await self.store.async_save(candidate)
            self.snapshot = candidate
        for listener in tuple(self.listeners):
            listener()
        return candidate["revision"]

    async def add_custom_item(self, revision, name, unit, date_kind, date_label=None):
        """Create a user-defined item; returns (revision, item_id)."""
        if type(revision) is not int or revision < 0:
            raise InventoryError("revision must be a nonnegative integer")
        definition = {"name": name, "unit": unit, "date_kind": date_kind}
        if date_label:
            definition["date_label"] = date_label
        async with self.lock:
            if revision != self.snapshot["revision"]:
                raise RevisionConflict("Inventory changed. Refresh and retry.")
            customs = self.snapshot.get("custom_items", {})
            if len(customs) >= MAX_CUSTOM_ITEMS:
                raise InventoryError("No more than 100 custom items")
            number = max([int(key[len(CUSTOM_ID_PREFIX):]) for key in customs] or [0]) + 1
            item_id = f"{CUSTOM_ID_PREFIX}{number}"
            validate_custom(item_id, definition, self.builtin)
            if any(item["name"].casefold() == name.casefold() for item in self.catalog.values()):
                raise InventoryError("An item with this name already exists")
            candidate = deepcopy(self.snapshot)
            candidate["revision"] += 1
            candidate.setdefault("custom_items", {})[item_id] = definition
            # A new item is something the household keeps, so it starts active and unchecked.
            candidate["items"][item_id] = {"applicable": True, "target": None, "verified_on": None,
                                           "confirmed": False, "lots": []}
            await self.store.async_save(candidate)
            self.snapshot = candidate
            self.catalog = {**self.catalog, item_id: custom_catalog_item(item_id, definition)}
        for listener in tuple(self.listeners):
            listener()
        return candidate["revision"], item_id

    async def remove_custom_item(self, revision, item_id):
        """Delete a user-defined item together with its stock record."""
        if type(revision) is not int or revision < 0:
            raise InventoryError("revision must be a nonnegative integer")
        async with self.lock:
            if revision != self.snapshot["revision"]:
                raise RevisionConflict("Inventory changed. Refresh and retry.")
            if item_id not in self.snapshot.get("custom_items", {}):
                raise InventoryError("Unknown custom item")
            candidate = deepcopy(self.snapshot)
            candidate["revision"] += 1
            del candidate["custom_items"][item_id]
            candidate["items"].pop(item_id, None)
            await self.store.async_save(candidate)
            self.snapshot = candidate
            self.catalog = {key: value for key, value in self.catalog.items() if key != item_id}
        for listener in tuple(self.listeners):
            listener()
        return candidate["revision"]
