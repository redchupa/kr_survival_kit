"""Render synthetic warehouse transitions in Chromium; never touches HA inventory."""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / "custom_components/kr_survival_kit/content/catalog.ko.json").read_text(encoding="utf-8"))["items"]
IDS = [
    "drinking-water", "water-container", "portable-water-filter", "water-sanitation-kit",
    "shelf-stable-meal", "canned-food", "butane-canister", "self-heating-ration",
    "flashlight", "batteries", "radio", "power-bank",
    "hygiene", "first-aid-kit", "backpack", "blanket",
]
ITEMS = [item for item in CATALOG if item["id"] in IDS]
EVIDENCE = ROOT / "output/release-evidence"


def make_snapshot(water_litres=None, expired=False):
    records = {}
    details = {}
    prepared = {
        "canned-food": (12, 6), "butane-canister": (8, 2),
        "flashlight": (2, 2), "batteries": (8, 4), "radio": (1, 1),
        "power-bank": (2, 1), "first-aid-kit": (1, 1), "blanket": (4, 2),
    }
    if water_litres is not None:
        prepared["drinking-water"] = (24000, water_litres * 1000)
    for item in ITEMS:
        item_id = item["id"]
        if item_id in prepared:
            target, quantity = prepared[item_id]
            expiry = "2026-01-01" if item_id == "drinking-water" and expired else "2027-06-01" if item["date_kind"] == "expiry" else None
            records[item_id] = {
                "applicable": True, "target": target, "confirmed": True,
                "verified_on": "2026-11-17",
                "lots": [{"lot_id": f"데모 {item['name']}", "quantity": quantity, "expires_on": expiry}],
            }
            usable = 0 if item_id == "drinking-water" and expired else quantity
            details[item_id] = {
                "state": "sufficient" if usable >= target else "shortage", "usable": usable,
                "target": target, "confirmed": True, "verified_on": "2026-11-17",
                "expiring_quantity": 0, "expired_quantity": quantity if item_id == "drinking-water" and expired else 0,
                "unknown_date_quantity": 0, "next_expiry_on": None if item_id == "drinking-water" and expired else expiry,
            }
        else:
            details[item_id] = {
                "state": "not_applicable" if item["tier"] in ("household", "optional") else "needs_check",
                "usable": 0, "target": None, "confirmed": False, "verified_on": None,
                "expiring_quantity": 0, "expired_quantity": 0, "unknown_date_quantity": 0, "next_expiry_on": None,
            }
    return {
        "catalog": ITEMS, "items": records, "revision": 1,
        "summary": {
            "items": details,
            "shortage_count": sum(value["state"] == "shortage" for value in details.values()),
            "needs_check_count": sum(value["state"] == "needs_check" for value in details.values()),
            "expiring_count": 0,
        },
        "household": {"items": [], "optional_items": []},
    }


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=1)
        page.set_content("""<html lang="ko"><style>
            body{margin:0;background:#0d1b29;color:#e7f6f8;font-family:Arial,sans-serif}
            .demo{padding:10px 24px;background:#294d5e;color:#fff;font-weight:700}
            </style><div class="demo">가상 데이터 데모 · 개인 재고 아님</div></html>""")
        page.add_script_tag(path=str(ROOT / "custom_components/kr_survival_kit/www/kr-survival-kit-card.js"))
        page.evaluate("""() => {
            window.demoCard = document.createElement('kr-survival-kit-inventory-card');
            window.demoCard.setConfig({guide_path: '#'});
            document.body.append(window.demoCard);
            window.demoCard._hass = {config: {time_zone: 'Asia/Seoul'}, states: {}};
        }""")

        def render(snapshot):
            page.evaluate("snapshot => { window.demoCard._snapshot = snapshot; window.demoCard._render(); }", snapshot)

        bottle = page.locator("kr-survival-kit-inventory-card .water-row .cargo")
        for stage, amount, expired, expected in [
            ("unknown", None, False, 0), ("zero", 0, False, 0),
            ("two-litres", 2, False, 1), ("four-litres", 4, False, 2),
            ("expired", 4, True, 0), ("deleted", None, False, 0),
        ]:
            render(make_snapshot(amount, expired))
            assert bottle.count() == 12, stage
            full = bottle.evaluate_all("els => els.filter(el => el.style.getPropertyValue('--cargo-fill') === '100.0%').length")
            assert full == expected, (stage, full, expected)
            if stage == "unknown":
                assert bottle.first.get_attribute("class") == "cargo unknown"
            if stage == "zero":
                assert bottle.first.get_attribute("class") == "cargo "
            if stage == "expired":
                assert "표시 기한 경과 4L" in page.locator("kr-survival-kit-inventory-card .water-row").get_attribute("title")
            if stage == "four-litres":
                assert "4/24 L" in page.locator("kr-survival-kit-inventory-card .water-row").get_attribute("title")
                page.screenshot(path=str(EVIDENCE / "warehouse-synthetic-desktop.jpg"), type="jpeg", quality=88)
                page.set_viewport_size({"width": 375, "height": 812})
                assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
                page.screenshot(path=str(EVIDENCE / "warehouse-synthetic-mobile.jpg"), type="jpeg", quality=88)
                page.evaluate("document.body.style.zoom = '2'")
                assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth"), "375px at 200% zoom overflow"
                assert page.locator("kr-survival-kit-inventory-card .water-row").count() == 1
                page.locator("kr-survival-kit-inventory-card .water-row").scroll_into_view_if_needed()
                page.screenshot(path=str(EVIDENCE / "warehouse-synthetic-mobile-zoom.jpg"), type="jpeg", quality=88)
                page.evaluate("document.body.style.zoom = ''")
                page.set_viewport_size({"width": 1280, "height": 900})

        mixed = make_snapshot(2)
        mixed["summary"]["items"]["drinking-water"].update({
            "state": "needs_check", "stale": False, "unknown_date_quantity": 22000,
        })
        mixed["items"]["drinking-water"]["lots"].append({
            "lot_id": "기한 미확인 데모", "quantity": 22000, "expires_on": None,
        })
        render(mixed)
        assert bottle.evaluate_all("els => els.filter(el => el.style.getPropertyValue('--cargo-fill') === '100.0%').length") == 1
        assert "표시 기한 미확인 22L" in page.locator("kr-survival-kit-inventory-card .water-row").get_attribute("title")
        mixed["summary"]["items"]["drinking-water"]["stale"] = True
        render(mixed)
        assert bottle.evaluate_all("els => els.filter(el => el.style.getPropertyValue('--cargo-fill') === '100.0%').length") == 0

        render(make_snapshot(2))
        page.locator('kr-survival-kit-inventory-card button[data-edit="drinking-water"]').click()
        target = page.locator("kr-survival-kit-inventory-card #editor #target")
        quantity = page.locator("kr-survival-kit-inventory-card #editor .quantity")
        assert target.input_value() == "24"
        assert quantity.input_value() == "2"
        target.fill("24.001")
        quantity.fill("4.25")
        page.evaluate("""() => {
            window.demoCard._hass.connection = {sendMessagePromise: async message => {
                if (message.service === 'set_item') throw new Error('Inventory changed revision');
                return {response: window.demoCard._snapshot};
            }};
        }""")
        page.locator("kr-survival-kit-inventory-card #editor button.primary").click()
        assert "입력한 값은 유지했습니다" in page.locator("kr-survival-kit-inventory-card .message").inner_text()
        assert target.input_value() == "24.001"
        assert quantity.input_value() == "4.25"
        page.evaluate("""() => {
            window.demoCard._hass.connection = {sendMessagePromise: async message => {
                if (message.service === 'set_item') {
                    window.savedDemo = message.service_data;
                    return {response: {}};
                }
                return {response: window.demoCard._snapshot};
            }};
        }""")
        page.locator("kr-survival-kit-inventory-card #editor button.primary").click()
        saved = page.evaluate("window.savedDemo")
        assert saved["target"] == 24001, saved
        assert saved["lots"][0]["quantity"] == 4250, saved

        browser.close()
    print("Synthetic warehouse DOM transitions, L/ml edit/conflict, and screenshots passed")


if __name__ == "__main__":
    main()
