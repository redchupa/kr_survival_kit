"""Behavioral checks for the local P2 snapshot."""

import asyncio
import json
from copy import deepcopy
from pathlib import Path

import pytest

from custom_components.kr_survival_kit.inventory import (
    Inventory, InventoryError, RevisionConflict, summarize,
)

CATALOG = json.loads(
    (Path(__file__).parents[1] / "custom_components/kr_survival_kit/content/catalog.ko.json").read_text(
        encoding="utf-8"
    )
)["items"]
WATER = "drinking-water"
TODAY = "2026-11-09"


class FakeStore:
    def __init__(self):
        self.saved = None
        self.fail = False

    async def async_load(self):
        return deepcopy(self.saved)

    async def async_save(self, data):
        await asyncio.sleep(0)
        if self.fail:
            raise OSError("Disk full")
        self.saved = deepcopy(data)


@pytest.mark.asyncio
async def test_zero_is_shortage_and_unrecorded_is_unknown():
    stock = Inventory(FakeStore(), CATALOG)
    initial = summarize(CATALOG, stock.snapshot["items"], TODAY)
    assert initial["items"][WATER]["state"] == "needs_check"
    assert initial["items"]["infant-supplies"]["state"] == "not_applicable"
    await stock.set_item(WATER, 0, True, 5000, [], True, TODAY)
    result = summarize(CATALOG, stock.snapshot["items"], TODAY)
    assert result["items"][WATER]["state"] == "shortage"
    assert result["items"][WATER]["usable"] == 0


@pytest.mark.asyncio
async def test_expiry_unknown_dates_midnight_and_stale_inspection():
    stock = Inventory(FakeStore(), CATALOG)
    lots = [
        {"lot_id": "old", "quantity": 1000, "expires_on": "2026-11-08"},
        {"lot_id": "today", "quantity": 2000, "expires_on": TODAY},
        {"lot_id": "unknown", "quantity": 4000, "expires_on": None},
    ]
    await stock.set_item(WATER, 0, True, 5000, lots, True, TODAY)
    result = summarize(CATALOG, stock.snapshot["items"], TODAY)
    assert result["items"][WATER]["state"] == "needs_check"
    assert result["items"][WATER]["usable"] == 2000
    assert result["items"][WATER]["unconfirmed"] == 4000
    assert result["expiring_count"] == 1
    next_day = summarize(CATALOG, stock.snapshot["items"], "2026-11-10")
    assert next_day["items"][WATER]["usable"] == 0
    assert next_day["expiring_count"] == 0
    stale = summarize(CATALOG, stock.snapshot["items"], "2026-12-11")
    assert stale["items"][WATER]["state"] == "needs_check"


@pytest.mark.asyncio
async def test_save_failure_conflict_and_restart():
    store = FakeStore()
    stock = Inventory(store, CATALOG)
    notifications = []
    stock.listeners.append(lambda: notifications.append(stock.snapshot["revision"]))
    store.fail = True
    with pytest.raises(OSError):
        await stock.set_item(WATER, 0, True, 5000, [], True, TODAY)
    assert stock.snapshot["revision"] == 0
    assert store.saved is None
    assert notifications == []
    store.fail = False
    results = await asyncio.gather(
        stock.set_item(WATER, 0, True, 5000, [], True, TODAY),
        stock.set_item("flashlight", 0, True, 1, [], True, TODAY),
        return_exceptions=True,
    )
    assert sum(isinstance(result, RevisionConflict) for result in results) == 1
    assert stock.snapshot["revision"] == 1
    assert notifications == [1]
    restored = Inventory(store, CATALOG)
    await restored.load()
    assert restored.snapshot == stock.snapshot
    with pytest.raises(RevisionConflict):
        await restored.delete_item(WATER, 0)


@pytest.mark.asyncio
async def test_delete_and_input_validation():
    stock = Inventory(FakeStore(), CATALOG)
    with pytest.raises(InventoryError):
        await stock.set_item(WATER, 0, True, 10, [{"lot_id": "a", "quantity": -1, "expires_on": TODAY}], True, TODAY)
    with pytest.raises(InventoryError):
        await stock.set_item(WATER, 0, True, True, [], True, TODAY)
    await stock.set_item(WATER, 0, True, 0, [], True, TODAY)
    assert summarize(CATALOG, stock.snapshot["items"], TODAY)["items"][WATER]["state"] == "not_applicable"
    await stock.delete_item(WATER, 1)
    assert WATER not in stock.snapshot["items"]


@pytest.mark.asyncio
async def test_edit_without_inspection_keeps_last_date_but_requires_check():
    stock = Inventory(FakeStore(), CATALOG)
    await stock.set_item(
        WATER, 0, True, 1000,
        [{"lot_id": "bottle", "quantity": 1000, "expires_on": "2027-01-01"}],
        True, TODAY,
    )
    assert summarize(CATALOG, stock.snapshot["items"], TODAY)["items"][WATER]["state"] == "sufficient"
    await stock.set_item(
        WATER, 1, True, 1000,
        [{"lot_id": "bottle", "quantity": 2000, "expires_on": "2027-01-01"}],
        False, "2026-11-10",
    )
    item = summarize(CATALOG, stock.snapshot["items"], "2026-11-10")["items"][WATER]
    assert item["verified_on"] == TODAY
    assert item["confirmed"] is False
    assert item["state"] == "needs_check"


@pytest.mark.asyncio
async def test_unknown_storage_schema_is_not_rewritten():
    store = FakeStore()
    store.saved = {"schema_version": 2, "revision": 4, "items": {}}
    stock = Inventory(store, CATALOG)
    with pytest.raises(InventoryError, match="Unsupported inventory schema"):
        await stock.load()
    assert store.saved["schema_version"] == 2
