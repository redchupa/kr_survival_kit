"""Inventory rules and durable, revision-checked updates."""

import asyncio
from copy import deepcopy
from datetime import date, timedelta


class InventoryError(ValueError):
    """Invalid inventory input."""


class RevisionConflict(InventoryError):
    """Another edit was saved first."""


def _date(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError) as error:
        raise InventoryError("Invalid ISO date") from error


def validate_item(catalog_item, applicable, target, lots):
    if type(applicable) is not bool:
        raise InventoryError("applicable must be a boolean")
    if target is not None and (type(target) is not int or target < 0):
        raise InventoryError("target must be a nonnegative integer or null")
    if not isinstance(lots, list):
        raise InventoryError("lots must be a list")
    seen = set()
    for lot in lots:
        if not isinstance(lot, dict) or set(lot) != {"lot_id", "quantity", "expires_on"}:
            raise InventoryError("Each lot needs lot_id, quantity, and expires_on")
        lot_id = lot["lot_id"]
        if not isinstance(lot_id, str) or not lot_id or len(lot_id) > 80 or lot_id in seen:
            raise InventoryError("lot_id must be unique and nonempty")
        seen.add(lot_id)
        if type(lot["quantity"]) is not int or lot["quantity"] < 0:
            raise InventoryError("quantity must be a nonnegative integer")
        expiry = lot["expires_on"]
        if catalog_item["date_kind"] == "expiry":
            if expiry is not None:
                _date(expiry)
        elif expiry is not None:
            raise InventoryError("Inspection items cannot have expiry dates")


def summarize(catalog, records, today, inspection_days=30, expiry_days=30):
    """Return per-item states and three independent counts."""
    today = _date(today) if isinstance(today, str) else today
    results = {}
    counts = {"shortage_count": 0, "needs_check_count": 0, "expiring_count": 0}
    for item in catalog:
        item_id = item["id"]
        record = records.get(item_id)
        if record is None:
            applicable = item["tier"] not in ("household", "optional")
            target = None
            verified_on = None
            confirmed = False
            lots = []
        else:
            applicable = record["applicable"]
            target = record["target"]
            verified_on = record["verified_on"]
            confirmed = record.get("confirmed", verified_on is not None)
            lots = record["lots"]
        usable = 0
        unconfirmed = 0
        expiring = 0
        for lot in lots:
            quantity = lot["quantity"]
            expiry = lot["expires_on"]
            if item["date_kind"] == "expiry":
                if expiry is None:
                    unconfirmed += quantity
                    continue
                expiry_date = _date(expiry)
                if expiry_date < today:
                    continue
                if expiry_date <= today + timedelta(days=expiry_days):
                    expiring += quantity
            usable += quantity
        stale = not confirmed or verified_on is None or _date(verified_on) < today - timedelta(days=inspection_days)
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
            "target": target,
            "verified_on": verified_on,
            "confirmed": confirmed,
        }
    return {"items": results, **counts}


class Inventory:
    """One persisted snapshot per HA config entry."""

    def __init__(self, store, catalog):
        self.store = store
        self.catalog = {item["id"]: item for item in catalog}
        self.snapshot = {"schema_version": 1, "revision": 0, "items": {}}
        self.lock = asyncio.Lock()
        self.listeners = []

    async def load(self):
        data = await self.store.async_load()
        if data is None:
            return
        if data.get("schema_version") != 1:
            raise InventoryError("Unsupported inventory schema")
        if type(data.get("revision")) is not int or data["revision"] < 0:
            raise InventoryError("Invalid inventory revision")
        for item_id, record in data["items"].items():
            if item_id in self.catalog:
                validate_item(self.catalog[item_id], record["applicable"], record["target"], record["lots"])
                if record["verified_on"] is not None:
                    _date(record["verified_on"])
        self.snapshot = deepcopy(data)

    async def set_item(self, item_id, revision, applicable, target, lots, confirm, today):
        if item_id not in self.catalog:
            raise InventoryError("Unknown item")
        if type(confirm) is not bool:
            raise InventoryError("confirm must be a boolean")
        validate_item(self.catalog[item_id], applicable, target, lots)
        today = _date(today).isoformat()
        async with self.lock:
            if revision != self.snapshot["revision"]:
                raise RevisionConflict("Inventory changed. Refresh and retry.")
            candidate = deepcopy(self.snapshot)
            candidate["revision"] += 1
            previous = candidate["items"].get(item_id, {})
            candidate["items"][item_id] = {
                "applicable": applicable,
                "target": target,
                "verified_on": today if confirm else previous.get("verified_on"),
                "confirmed": confirm,
                "lots": deepcopy(lots),
            }
            await self.store.async_save(candidate)
            self.snapshot = candidate
        for listener in tuple(self.listeners):
            listener()
        return candidate["revision"]

    async def delete_item(self, item_id, revision):
        if item_id not in self.catalog:
            raise InventoryError("Unknown item")
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
