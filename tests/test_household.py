"""Validate the public, non-binding household calculation examples."""

import json
from datetime import date
from pathlib import Path


CONTENT = Path(__file__).resolve().parents[1] / "custom_components" / "kr_survival_kit" / "content"


def test_household_recommendations_are_consistent_and_non_binding():
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

    assert 2 * guide["people"] * guide["days"] == 24
    assert 3.785 * guide["people"] * guide["days"] <= 46
    assert 46 / 2 == 23
    assert 3 * guide["people"] * guide["days"] == 36
    assert "106 L" in guide["extended"][0]["quantity"]
    assert "212 L" in guide["extended"][1]["quantity"]
    assert all("target" not in item and "lots" not in item for item in guide["items"])


if __name__ == "__main__":
    test_household_recommendations_are_consistent_and_non_binding()
    print("Household content checks passed")
