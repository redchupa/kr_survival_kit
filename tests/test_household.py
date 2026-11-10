"""Validate the public, non-binding household calculation examples."""

import json
import importlib.util
import unittest
from datetime import date
from pathlib import Path


CONTENT = Path(__file__).resolve().parents[1] / "custom_components" / "kr_survival_kit" / "content"
REQUESTED_OPTIONAL_IDS = {
    "portable-stove", "butane-canister", "candles", "hand-warmers",
    "large-plastic-bags", "lighter", "solid-fuel", "child-id-card",
    "portable-solar-panel",
}


def check_household_recommendations_are_consistent_and_non_binding():
    catalog = json.loads((CONTENT / "catalog.ko.json").read_text(encoding="utf-8"))
    guide = json.loads((CONTENT / "household.ko.json").read_text(encoding="utf-8"))
    ids = {item["id"] for item in catalog["items"]}
    assert guide["review_status"] in {"draft", "reviewed"}
    if guide["review_status"] == "draft":
        assert guide["reviewed_on"] is None
    else:
        assert date.fromisoformat(guide["reviewed_on"])
    assert (guide["people"], guide["days"]) == (4, 3)
    assert "24 L" in guide["compact_summary"]
    assert "46 L" in guide["compact_summary"]
    assert "36인분" in guide["compact_summary"]

    recommendations = {item["item_id"]: item for item in guide["items"]}
    assert len(recommendations) == len(guide["items"])
    assert recommendations.keys() <= ids
    assert "24 L" in recommendations["drinking-water"]["quantity"]
    assert "46 L" in recommendations["water-container"]["quantity"]
    assert "포함" in recommendations["water-container"]["quantity"]
    assert "합계" in recommendations["shelf-stable-meal"]["label"]
    assert "36인분" in recommendations["shelf-stable-meal"]["quantity"]
    for item in [*guide["items"], *guide["extended"]]:
        assert item["quantity"] and item["basis"]
        assert item["source_ids"]
        assert set(item["source_ids"]) <= guide["sources"].keys()
    optional_catalog = {item["id"] for item in catalog["items"] if item["tier"] == "optional"}
    optional_explained = {item["item_id"] for item in guide["optional_items"]}
    assert optional_explained == optional_catalog - {"radio", "water-container"}
    assert guide["optional_intro"]
    assert len({item["basis"] for item in guide["optional_items"]}) == len(guide["optional_items"])
    for item in guide["optional_items"]:
        assert item["quantity"] and item["basis"]
        assert "프로젝트 선택 품목. 가족 필요" not in item["basis"]
        assert set(item["source_ids"]) <= guide["sources"].keys()

    assert 2 * guide["people"] * guide["days"] == 24
    assert 3.785 * guide["people"] * guide["days"] <= 46
    assert 46 / 2 == 23
    assert 3 * guide["people"] * guide["days"] == 36
    assert "106 L" in guide["extended"][0]["quantity"]
    assert "212 L" in guide["extended"][1]["quantity"]
    assert all("target" not in item and "lots" not in item for item in guide["items"])


class HouseholdContentTest(unittest.TestCase):
    def test_household_recommendations_are_consistent_and_non_binding(self):
        check_household_recommendations_are_consistent_and_non_binding()

    def test_requested_optional_items_leave_default_counts_unchanged(self):
        catalog = json.loads((CONTENT / "catalog.ko.json").read_text(encoding="utf-8"))["items"]
        by_id = {item["id"]: item for item in catalog}
        self.assertEqual(len(by_id), len(catalog))
        self.assertTrue(REQUESTED_OPTIONAL_IDS <= by_id.keys())
        self.assertTrue(all(by_id[item_id]["tier"] == "optional" for item_id in REQUESTED_OPTIONAL_IDS))
        optional_ids = {item["id"] for item in catalog if item["tier"] == "optional"}

        spec = importlib.util.spec_from_file_location(
            "survival_inventory_rules", CONTENT.parent / "inventory.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        summary = module.summarize(catalog, {}, "2026-11-10")
        self.assertEqual({summary["items"][item_id]["state"] for item_id in optional_ids}, {"not_applicable"})
        self.assertEqual(summary["shortage_count"], 0)
        self.assertEqual(summary["needs_check_count"], sum(item["tier"] not in ("household", "optional") for item in catalog))

        records = {
            "portable-stove": {
                "applicable": True, "target": 1, "lots": [],
                "verified_on": "2026-11-10", "confirmed": True,
            }
        }
        activated = module.summarize(catalog, records, "2026-11-10")
        self.assertEqual(activated["items"]["portable-stove"]["state"], "shortage")
        self.assertEqual(activated["shortage_count"], 1)


if __name__ == "__main__":
    unittest.main()
