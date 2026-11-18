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
    assert result["items"][WATER]["stale"] is False
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
    with pytest.raises(InventoryError, match="target"):
        await stock.set_item(WATER, 0, True, 1_000_000_001, [], True, TODAY)
    with pytest.raises(InventoryError, match="quantity"):
        await stock.set_item(WATER, 0, True, 1, [{"lot_id": "overflow", "quantity": 1_000_000_001, "expires_on": TODAY}], True, TODAY)
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


@pytest.mark.asyncio
async def test_butane_and_ration_rotation_by_purchase_lot():
    """Per-product dates, not a guessed universal shelf life, drive rotation."""
    store = FakeStore()
    stock = Inventory(store, CATALOG)
    assert {item["id"]: item["date_kind"] for item in CATALOG}[
        "self-heating-ration"
    ] == "expiry"
    await stock.set_item("butane-canister", 0, True, 4, [
        {"lot_id": "old-can", "quantity": 1, "expires_on": "2026-11-08"},
        {"lot_id": "replace-soon", "quantity": 2, "expires_on": "2026-11-20"},
        {"lot_id": "date-not-known", "quantity": 1, "expires_on": None},
    ], True, TODAY)
    await stock.set_item("self-heating-ration", 1, True, 2, [
        {"lot_id": "meal-a", "quantity": 1, "expires_on": "2027-02-01"},
        {"lot_id": "meal-b", "quantity": 1, "expires_on": "2026-12-01"},
    ], True, TODAY)
    summary = summarize(CATALOG, stock.snapshot["items"], TODAY)
    gas = summary["items"]["butane-canister"]
    meal = summary["items"]["self-heating-ration"]
    assert gas["expired_quantity"] == 1
    assert gas["unknown_date_quantity"] == 1
    assert gas["usable"] == gas["expiring_quantity"] == 2
    assert gas["next_expiry_on"] == "2026-11-20"
    assert gas["state"] == "shortage"
    assert meal["next_expiry_on"] == "2026-12-01"
    assert meal["expiring_quantity"] == 1
    assert meal["state"] == "sufficient"
    assert summary["expiring_count"] == 2


@pytest.mark.asyncio
async def test_delete_failure_and_invalid_input_leave_snapshot_intact():
    store = FakeStore()
    stock = Inventory(store, CATALOG)
    await stock.set_item(WATER, 0, True, 1, [], True, TODAY)
    original = deepcopy(stock.snapshot)
    store.fail = True
    with pytest.raises(OSError):
        await stock.delete_item(WATER, 1)
    assert stock.snapshot == original == store.saved
    store.fail = False
    for bad_revision in (True, -1, "1"):
        with pytest.raises(InventoryError, match="revision"):
            await stock.delete_item(WATER, bad_revision)
    for invalid_lot in (
        {"lot_id": "line\nbreak", "quantity": 1, "expires_on": TODAY},
        {"lot_id": "compact-date", "quantity": 1, "expires_on": "20261109"},
    ):
        with pytest.raises(InventoryError):
            await stock.set_item(WATER, 1, True, 1, [invalid_lot], True, TODAY)
    assert stock.snapshot == original
    with pytest.raises(InventoryError, match="200"):
        await stock.set_item(WATER, 1, True, 1, [
            {"lot_id": str(index), "quantity": 1, "expires_on": TODAY}
            for index in range(201)
        ], True, TODAY)


@pytest.mark.asyncio
async def test_corrupt_store_does_not_replace_live_snapshot():
    store = FakeStore()
    stock = Inventory(store, CATALOG)
    await stock.set_item(WATER, 0, True, 1, [], True, TODAY)
    original = deepcopy(stock.snapshot)
    store.saved = {"schema_version": 1, "revision": 2, "items": {WATER: {"confirmed": "yes"}}}
    with pytest.raises(InventoryError, match="Invalid inventory record"):
        await stock.load()
    assert stock.snapshot == original


@pytest.mark.asyncio
async def test_litre_display_metadata_preserves_millilitre_storage():
    water = next(item for item in CATALOG if item["id"] == WATER)
    assert (water["unit"], water["display_unit"], water["display_scale"]) == ("ml", "L", 1000)
    store = FakeStore()
    stock = Inventory(store, CATALOG)
    # UI values 24 L, 2 L, and 1.25 L must arrive as exact integer ml.
    await stock.set_item(WATER, 0, True, 24000, [
        {"lot_id": "2 L bottle", "quantity": 2000, "expires_on": "2027-01-01"},
        {"lot_id": "1.25 L bottle", "quantity": 1250, "expires_on": "2027-02-01"},
        {"lot_id": "legacy 1 ml", "quantity": 1, "expires_on": "2027-03-01"},
    ], True, TODAY)
    restored = Inventory(store, CATALOG)
    await restored.load()
    record = restored.snapshot["items"][WATER]
    assert record["target"] == 24000
    assert [lot["quantity"] for lot in record["lots"]] == [2000, 1250, 1]
    assert summarize(CATALOG, restored.snapshot["items"], TODAY)["items"][WATER]["usable"] == 3251


@pytest.mark.asyncio
async def test_received_date_and_review_interval_are_separate_from_expiry():
    store = FakeStore()
    stock = Inventory(store, CATALOG)
    lot = {"lot_id": "bottle", "quantity": 2000, "expires_on": "2027-05-01", "received_on": "2026-11-01"}
    await stock.set_item(WATER, 0, True, 2000, [lot], False, TODAY, review_interval_days=14)
    item = summarize(CATALOG, stock.snapshot["items"], TODAY)["items"][WATER]
    assert (item["next_review_on"], item["review_days_remaining"]) == ("2026-11-15", 6)
    assert (item["next_expiry_on"], item["expiry_days_remaining"]) == ("2027-05-01", 173)
    assert item["state"] == "needs_check"  # Intake is not a verified inspection.
    await stock.set_item(WATER, 1, True, 2000, [lot], True, TODAY)
    confirmed = summarize(CATALOG, stock.snapshot["items"], TODAY)["items"][WATER]
    assert (confirmed["next_review_on"], confirmed["review_days_remaining"]) == ("2026-11-23", 14)
    assert confirmed["state"] == "sufficient"
    overdue = summarize(CATALOG, stock.snapshot["items"], "2026-11-24")["items"][WATER]
    assert overdue["review_days_remaining"] == -1
    assert overdue["stale"] is True
    assert overdue["state"] == "needs_check"
    restored = Inventory(store, CATALOG)
    await restored.load()
    assert restored.snapshot["items"][WATER]["review_interval_days"] == 14
    assert restored.snapshot["items"][WATER]["lots"][0]["received_on"] == "2026-11-01"
    await restored.set_item(WATER, 2, True, 2000, [lot], True, TODAY, review_interval_days=None)
    reset = summarize(CATALOG, restored.snapshot["items"], TODAY)["items"][WATER]
    assert reset["review_interval_days"] == 30
    assert reset["next_review_on"] == "2026-12-09"


@pytest.mark.asyncio
async def test_legacy_v1_and_invalid_new_fields_preserve_store():
    store = FakeStore()
    store.saved = {"schema_version": 1, "revision": 7, "items": {WATER: {
        "applicable": True, "target": 1000, "verified_on": TODAY, "confirmed": True,
        "lots": [{"lot_id": "legacy", "quantity": 1000, "expires_on": "2027-01-01"}],
    }}}
    stock = Inventory(store, CATALOG)
    await stock.load()
    assert stock.snapshot == {**store.saved, "household_size": 4}
    assert "household_size" not in store.saved
    assert summarize(CATALOG, stock.snapshot["items"], TODAY)["items"][WATER]["review_interval_days"] == 30
    for bad in (0, -1, True, 3651, "30"):
        with pytest.raises(InventoryError, match="review_interval_days"):
            await stock.set_item(WATER, 7, True, 1000, stock.snapshot["items"][WATER]["lots"], True, TODAY, bad)
    for bad in ("20261101", "2026-02-30", True):
        with pytest.raises(InventoryError, match="date"):
            await stock.set_item(WATER, 7, True, 1000, [{
                "lot_id": "new", "quantity": 1000, "expires_on": "2027-01-01", "received_on": bad,
            }], True, TODAY)
    assert stock.snapshot == {**store.saved, "household_size": 4}
    assert "household_size" not in store.saved
    store.fail = True
    with pytest.raises(OSError):
        await stock.set_item(WATER, 7, True, 1000, [{
            "lot_id": "new", "quantity": 1000, "expires_on": "2027-01-01", "received_on": TODAY,
        }], True, TODAY, 7)
    assert stock.snapshot == {**store.saved, "household_size": 4}
    assert "household_size" not in store.saved


@pytest.mark.asyncio
async def test_concurrent_review_interval_update_keeps_winning_revision():
    stock = Inventory(FakeStore(), CATALOG)
    lot = {"lot_id": "water", "quantity": 1000, "expires_on": "2027-01-01", "received_on": TODAY}
    attempts = await asyncio.gather(
        stock.set_item(WATER, 0, True, 1000, [lot], True, TODAY, 7),
        stock.set_item(WATER, 0, True, 1000, [lot], True, TODAY, 90),
        return_exceptions=True,
    )
    assert sum(isinstance(value, RevisionConflict) for value in attempts) == 1
    assert stock.snapshot["revision"] == 1
    assert stock.snapshot["items"][WATER]["review_interval_days"] in (7, 90)


@pytest.mark.asyncio
async def test_household_and_bottle_inputs_survive_restart():
    store = FakeStore()
    stock = Inventory(store, CATALOG)
    def targets():
        return summarize(CATALOG, stock.snapshot["items"], TODAY,
                         household_size=stock.snapshot["household_size"])["items"]

    assert targets()[WATER]["target"] == 24000
    store.fail = True
    with pytest.raises(OSError):
        await stock.set_household_size(0, 3)
    assert stock.snapshot["household_size"] == 4
    store.fail = False
    lot = {"lot_id": "water", "quantity": 24000, "bottle_ml": 2000,
           "bottle_count": 12, "expires_on": "2027-01-01"}
    with pytest.raises(InventoryError, match="bottle"):
        await stock.set_item(WATER, 0, True, None, [{**lot, "quantity": 12}], True, TODAY)
    await stock.set_item(WATER, 0, True, None, [lot], True, TODAY)
    assert targets()[WATER]["state"] == "sufficient"
    with pytest.raises(RevisionConflict):
        await stock.set_household_size(0, 5)
    await stock.set_household_size(1, 5)
    assert targets()[WATER]["target"] == 30000
    assert targets()[WATER]["usable"] == 24000
    assert targets()[WATER]["state"] == "shortage"
    assert targets()["backpack"]["target"] == 5
    assert targets()["flashlight"]["target"] == 2
    stock = Inventory(store, CATALOG)
    await stock.load()
    assert stock.snapshot["household_size"] == 5
    assert stock.snapshot["items"][WATER]["lots"] == [lot]
    await stock.set_item(WATER, 2, True, 0, [{**lot, "quantity": 0, "bottle_count": 0,
                                              "expires_on": None}], True, TODAY)
    assert targets()[WATER]["target"] == 0
    assert targets()[WATER]["recommended_target"] == 30000


@pytest.mark.asyncio
async def test_storage_location_per_lot_survives_restart_and_rejects_bad_text():
    store = FakeStore()
    stock = Inventory(store, CATALOG)
    entry = {"lot_id": "entry", "quantity": 12000, "expires_on": "2027-05-01", "location": "현관 팬트리"}
    kitchen = {"lot_id": "kitchen", "quantity": 12000, "expires_on": "2027-08-01", "location": "주방 팬트리 3층 선반"}
    unplaced = {"lot_id": "unplaced", "quantity": 0, "expires_on": None, "location": None}
    await stock.set_item(WATER, 0, True, 24000, [entry, kitchen, unplaced], True, TODAY)
    status = summarize(CATALOG, stock.snapshot["items"], TODAY)["items"][WATER]
    assert status["usable"] == 24000

    reloaded = Inventory(store, CATALOG)
    await reloaded.load()
    assert [lot.get("location") for lot in reloaded.snapshot["items"][WATER]["lots"]] == ["현관 팬트리", "주방 팬트리 3층 선반", None]

    before = deepcopy(store.saved)
    for bad in ["", "  현관", "현관 ", "가" * 61, "현관\n팬트리", 3, ["현관"]]:
        with pytest.raises(InventoryError, match="location"):
            await reloaded.set_item(WATER, 1, True, 24000, [{**entry, "location": bad}], True, TODAY)
    assert store.saved == before
    # Exactly 60 characters is allowed.
    await reloaded.set_item("flashlight", 1, True, 2, [{"lot_id": "a", "quantity": 2, "expires_on": None, "location": "나" * 60}], True, TODAY)


@pytest.mark.asyncio
async def test_restore_keeps_original_inspection_day_and_rejects_future_or_unconfirmed():
    store = FakeStore()
    stock = Inventory(store, CATALOG)
    lot = {"lot_id": "a", "quantity": 2, "expires_on": None}
    revision = await stock.set_item("flashlight", 0, True, 2, [lot], True, TODAY, verified_on="2026-05-01")
    assert stock.snapshot["items"]["flashlight"]["verified_on"] == "2026-05-01"
    # Inspected six months ago with a 30-day cycle: the restored item must still ask for a check.
    assert summarize(CATALOG, stock.snapshot["items"], TODAY)["items"]["flashlight"]["stale"] is True

    before = deepcopy(store.saved)
    for bad, confirm in [("2026-11-10", True), ("2026-02-30", True), ("2026-5-1", True), (20260501, True), ("2026-05-01", False)]:
        with pytest.raises(InventoryError):
            await stock.set_item("flashlight", revision, True, 2, [lot], confirm, TODAY, verified_on=bad)
    assert store.saved == before
    # Same-day and omitted values keep the old behaviour (today).
    revision = await stock.set_item("flashlight", revision, True, 2, [lot], True, TODAY, verified_on=TODAY)
    await stock.set_item("flashlight", revision, True, 2, [lot], True, TODAY)
    assert stock.snapshot["items"]["flashlight"]["verified_on"] == TODAY


@pytest.mark.asyncio
async def test_batteries_medicine_and_hygiene_track_use_by_dates():
    kinds = {item["id"]: (item["date_kind"], item.get("date_label")) for item in CATALOG}
    for item_id in ("batteries", "batteries-aaa", "batteries-special"):
        assert kinds[item_id] == ("expiry", "사용 권장기한")
    for item_id in ("otc-medicine", "first-aid-kit", "prescription-preparedness", "wet-wipes",
                    "water-sanitation-kit", "infant-supplies"):
        assert kinds[item_id] == ("expiry", "사용기한")
    # Items without a meaningful printed date stay inspection-only.
    for item_id in ("hygiene", "candles", "lighter", "salt-jar", "flashlight"):
        assert kinds[item_id][0] == "inspection"

    stock = Inventory(FakeStore(), CATALOG)
    revision = await stock.set_item("batteries", 0, True, 8, [
        {"lot_id": "old", "quantity": 4, "expires_on": "2026-11-01"},
        {"lot_id": "soon", "quantity": 2, "expires_on": "2026-12-01"},
        {"lot_id": "unknown", "quantity": 2, "expires_on": None},
    ], True, TODAY, apply_date_defaults=True)
    status = summarize(CATALOG, stock.snapshot["items"], TODAY)["items"]["batteries"]
    assert (status["expired_quantity"], status["expiring_quantity"], status["unknown_date_quantity"]) == (4, 2, 2)
    assert status["usable"] == 2 and status["state"] == "shortage"
    assert status["next_label_check_on"] == "2026-11-23", "batteries get a 14-day label check reminder"
    # Records saved before the switch (no dates) still load and simply ask for a date.
    legacy = {"schema_version": 1, "revision": 3, "household_size": 4, "items": {"batteries-aaa": {
        "applicable": True, "target": 4, "verified_on": TODAY, "confirmed": True,
        "lots": [{"lot_id": "lot-1", "quantity": 4, "expires_on": None}]}}}
    store = FakeStore()
    store.saved = legacy
    reloaded = Inventory(store, CATALOG)
    await reloaded.load()
    status = summarize(CATALOG, reloaded.snapshot["items"], TODAY)["items"]["batteries-aaa"]
    assert (status["state"], status["unknown_date_quantity"]) == ("needs_check", 4)
    assert revision == 1


@pytest.mark.asyncio
async def test_custom_items_round_trip_and_reject_markup():
    store = FakeStore()
    stock = Inventory(store, CATALOG)
    revision, lantern = await stock.add_custom_item(0, "캠핑용 랜턴", "개", "inspection")
    revision, food = await stock.add_custom_item(revision, "반려견 사료", "kg", "expiry", "소비기한")
    assert (lantern, food) == ("custom-1", "custom-2")
    assert stock.catalog[food]["tier"] == "optional" and stock.catalog[food]["custom"] is True
    assert stock.snapshot["items"][lantern]["applicable"] is True
    revision = await stock.set_item(food, revision, True, 10, [
        {"lot_id": "a", "quantity": 8, "expires_on": "2027-01-01", "location": "베란다 창고"}], True, TODAY)
    status = summarize(stock.catalog.values(), stock.snapshot["items"], TODAY)["items"][food]
    assert (status["usable"], status["state"]) == (8, "shortage")

    before = deepcopy(store.saved)
    bad = [("<script>", "개", "inspection", None), ("a\"b", "개", "inspection", None), ("a&b", "개", "inspection", None),
           ("가" * 41, "개", "inspection", None), ("", "개", "inspection", None), (" 앞공백", "개", "inspection", None),
           ("줄\n바꿈", "개", "inspection", None), ("단위", "ml", "inspection", None), ("종류", "개", "maybe", None),
           ("라벨", "개", "inspection", "소비기한"), ("라벨2", "개", "expiry", "<b>"), ("캠핑용 랜턴", "개", "inspection", None),
           ("생수", "개", "inspection", None)]
    for name, unit, kind, label in bad:
        with pytest.raises(InventoryError):
            await stock.add_custom_item(revision, name, unit, kind, label)
    assert store.saved == before
    with pytest.raises(RevisionConflict):
        await stock.add_custom_item(revision - 1, "새 물품", "개", "inspection")

    reloaded = Inventory(store, CATALOG)
    await reloaded.load()
    assert reloaded.catalog[food]["name"] == "반려견 사료"
    assert reloaded.snapshot["items"][food]["lots"][0]["location"] == "베란다 창고"
    revision = await reloaded.remove_custom_item(revision, food)
    assert food not in reloaded.catalog and food not in reloaded.snapshot["items"]
    with pytest.raises(InventoryError):
        await reloaded.remove_custom_item(revision, "drinking-water")
    with pytest.raises(InventoryError):
        await reloaded.set_item(food, revision, True, 1, [], True, TODAY)
    # Numbering continues after the highest remaining id, so a removed id is never confused with a new one.
    revision, again = await reloaded.add_custom_item(revision, "구급 담요", "장", "inspection")
    assert again == "custom-2"


@pytest.mark.asyncio
async def test_markup_characters_are_refused_in_locations_and_repaired_in_old_data():
    stock = Inventory(FakeStore(), CATALOG)
    for bad in ["<img src=x>", "현관\"팬트리", "a'b", "a`b", "a&b", "a\b"]:
        with pytest.raises(InventoryError, match="location"):
            await stock.set_item("flashlight", 0, True, 2, [{"lot_id": "a", "quantity": 1, "expires_on": None, "location": bad}], True, TODAY)
    store = FakeStore()
    store.saved = {"schema_version": 1, "revision": 2, "household_size": 4, "items": {
        "flashlight": {"applicable": True, "target": 2, "verified_on": TODAY, "confirmed": True, "lots": [
            {"lot_id": "a", "quantity": 1, "expires_on": None, "location": "<img src=x onerror=alert(1)>현관"},
            {"lot_id": "b", "quantity": 1, "expires_on": None, "location": "<>"}]}},
        "custom_items": {"custom-1": {"name": "<b>랜턴</b>", "unit": "개", "date_kind": "inspection"}}}
    old = Inventory(store, CATALOG)
    await old.load()
    lots = old.snapshot["items"]["flashlight"]["lots"]
    assert [lot["location"] for lot in lots] == ["img src=x onerror=alert(1)현관", None]
    assert old.catalog["custom-1"]["name"] == "b랜턴/b"
    store.saved["custom_items"] = {"custom-01": {"name": "x", "unit": "개", "date_kind": "inspection"}}
    with pytest.raises(InventoryError):
        await Inventory(store, CATALOG).load()
