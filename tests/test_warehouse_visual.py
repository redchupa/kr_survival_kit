"""Render the synthetic complete-items card in Chromium; never touches HA inventory."""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / "custom_components/kr_survival_kit/content/catalog.ko.json").read_text(encoding="utf-8"))["items"]
QUIZ = json.loads((ROOT / "custom_components/kr_survival_kit/content/quiz.ko.json").read_text(encoding="utf-8"))
GUIDE_SOURCES = json.loads((ROOT / "custom_components/kr_survival_kit/content/guide.ko.json").read_text(encoding="utf-8"))["sources"]
IDS = [
    "drinking-water", "water-container", "portable-water-filter", "water-sanitation-kit",
    "shelf-stable-meal", "canned-food", "butane-canister", "self-heating-ration",
    "flashlight", "batteries", "radio", "power-bank",
    "hygiene", "first-aid-kit", "backpack", "blanket",
]
ITEMS = [item for item in CATALOG if item["id"] in IDS]
EVIDENCE = ROOT / "output/release-evidence"


def make_snapshot(water_litres=None, expired=False, demo_full=False):
    records = {}
    details = {}
    prepared = {
        "canned-food": (12, 6), "butane-canister": (8, 2),
        "flashlight": (2, 1), "batteries": (8, 4), "radio": (1, 0),
        "power-bank": (2, 1), "first-aid-kit": (1, 0), "blanket": (4, 2),
    }
    if water_litres is not None:
        prepared["drinking-water"] = (24000, water_litres * 1000)
    if demo_full:
        prepared.update({
            "water-container": (2, 2), "portable-water-filter": (1, 1),
            "shelf-stable-meal": (12, 12), "hygiene": (1, 1), "backpack": (1, 1),
        })
        prepared = {key: (target, target) for key, (target, _) in prepared.items()}
    for item in ITEMS:
        item_id = item["id"]
        if item_id in prepared:
            target, quantity = prepared[item_id]
            expiry = "2026-01-01" if item_id == "drinking-water" and expired else "2027-06-01" if item["date_kind"] == "expiry" else None
            records[item_id] = {
                "applicable": True, "target": target, "confirmed": True,
                "verified_on": "2026-11-17",
                "review_interval_days": 45 if item_id == "drinking-water" else None,
                "lots": [{"lot_id": f"데모 {item['name']}", "quantity": quantity, "expires_on": expiry,
                          **({"received_on": "2026-11-01"} if item_id == "drinking-water" else {})}],
            }
            usable = 0 if item_id == "drinking-water" and expired else quantity
            details[item_id] = {
                "state": "sufficient" if usable >= target else "shortage", "usable": usable,
                "target": target, "confirmed": True, "verified_on": "2026-11-17", "stale": False,
                "review_interval_days": 45 if item_id == "drinking-water" else 30,
                "next_review_on": "2027-01-01",
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
        page.route("https://synthetic.invalid/*", lambda route: route.fulfill(status=200, body="<html></html>"))
        page.goto("https://synthetic.invalid/")
        page.set_content("""<html lang="ko"><style>
            body{margin:0;background:#0d1b29;color:#e7f6f8;font-family:Arial,sans-serif}
            .demo{padding:10px 24px;background:#294d5e;color:#fff;font-weight:700}
            </style><div class="demo">가상 데이터 데모 · 개인 재고 아님</div></html>""")
        page.add_script_tag(path=str(ROOT / "custom_components/kr_survival_kit/www/kr-survival-kit-card.js"))
        page.evaluate("""({quiz, sources}) => {
            window.demoCard = document.createElement('kr-survival-kit-inventory-card');
            window.demoCard.setConfig({guide_path: '#', quiz_data: quiz, quiz_sources: sources});
            document.body.append(window.demoCard);
            window.demoCard._hass = {config: {time_zone: 'Asia/Seoul'}, states: {}};
        }""", {"quiz": QUIZ, "sources": GUIDE_SOURCES})

        def render(snapshot):
            page.evaluate("snapshot => { window.demoCard._snapshot = snapshot; window.demoCard._render(); }", snapshot)

        ready = page.locator("kr-survival-kit-inventory-card .ready-item")
        for stage, amount, expired, expected in [
            ("unknown", None, False, 0), ("zero", 0, False, 0),
            ("two-litres", 2, False, 0), ("four-litres", 4, False, 0),
            ("complete", 24, False, 1), ("expired", 24, True, 0), ("deleted", None, False, 0),
        ]:
            render(make_snapshot(amount, expired))
            assert ready.count() == expected, (stage, ready.count(), expected)
            if expected:
                assert ready.locator(".ready-art").count() == 1
                assert "24 L / 24 L" in ready.inner_text()
                assert "준비 기록 단계 1/4" in page.locator("kr-survival-kit-inventory-card .mission-head").inner_text()
                assert page.locator("kr-survival-kit-inventory-card .mission-progress").get_attribute("aria-valuenow") == "1"
            else:
                assert "목표량·기한·실사를 기록하세요" in page.locator("kr-survival-kit-inventory-card .ready-empty").inner_text()

        render(make_snapshot(24, demo_full=True))
        assert ready.count() == 14, ready.count()
        assert "준비 기록 단계 4/4" in page.locator("kr-survival-kit-inventory-card .mission-head").inner_text()
        assert page.locator("kr-survival-kit-inventory-card .mission-progress").get_attribute("aria-valuenow") == "4"
        assert page.locator("kr-survival-kit-inventory-card .mission-item.done").count() == 4
        assert page.locator("kr-survival-kit-inventory-card .ready-grid").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length") == 10
        assert page.locator("kr-survival-kit-inventory-card .ready-art").count() == 14
        page.wait_for_timeout(600)
        page.screenshot(path=str(EVIDENCE / "warehouse-synthetic-desktop.jpg"), type="jpeg", quality=88)
        page.set_viewport_size({"width": 375, "height": 812})
        assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
        assert page.locator("kr-survival-kit-inventory-card .ready-grid").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length") == 2
        page.locator("kr-survival-kit-inventory-card .ready-panel").scroll_into_view_if_needed()
        page.screenshot(path=str(EVIDENCE / "warehouse-synthetic-mobile.jpg"), type="jpeg", quality=88)
        page.evaluate("document.body.style.zoom = '2'")
        assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth"), "375px at 200% zoom overflow"
        page.screenshot(path=str(EVIDENCE / "warehouse-synthetic-mobile-zoom.jpg"), type="jpeg", quality=88)
        page.evaluate("document.body.style.zoom = ''")
        page.set_viewport_size({"width": 1280, "height": 900})

        first = QUIZ["questions"][0]
        wrong = next(choice for choice in first["choices"] if choice["id"] != first["answer_id"])
        wrong_button = page.locator(f'kr-survival-kit-inventory-card [data-quiz-choice="{wrong["id"]}"]')
        wrong_button.focus()
        page.keyboard.press("Enter")
        assert "다시 확인해 보세요" in page.locator("kr-survival-kit-inventory-card .quiz-feedback").inner_text()
        assert "정답:" in page.locator("kr-survival-kit-inventory-card .quiz-feedback").inner_text()
        assert page.locator("kr-survival-kit-inventory-card .quiz-sources a[href^='https://']").count() >= 1
        assert page.locator(f'kr-survival-kit-inventory-card [data-quiz-choice="{wrong["id"]}"]').evaluate("el => el === el.getRootNode().activeElement")
        page.locator(f'kr-survival-kit-inventory-card [data-quiz-choice="{first["answer_id"]}"]').click()
        assert "맞았습니다" in page.locator("kr-survival-kit-inventory-card .quiz-feedback").inner_text()
        assert "정답 1/8" in page.locator("kr-survival-kit-inventory-card .quiz-head").inner_text()
        stored_quiz = page.evaluate("JSON.parse(localStorage.getItem('kr_survival_kit_quiz_v1'))")
        assert stored_quiz["answers"] == {first["id"]: first["answer_id"]}
        assert "items" not in stored_quiz and "summary" not in stored_quiz
        page.evaluate("""() => {
            const saved = JSON.parse(localStorage.getItem('kr_survival_kit_quiz_v1'));
            saved.answers['unknown-question'] = 'invented';
            saved.answers[window.demoCard._quizData.questions[1].id] = 'invalid-choice';
            localStorage.setItem('kr_survival_kit_quiz_v1', JSON.stringify(saved));
        }""")
        page.evaluate("({quiz, sources}) => window.demoCard.setConfig({guide_path:'#', quiz_data:quiz, quiz_sources:sources})", {"quiz": json.dumps(QUIZ, ensure_ascii=False), "sources": json.dumps(GUIDE_SOURCES, ensure_ascii=False)})
        assert "학습 진도 1/8" in page.locator("kr-survival-kit-inventory-card .quiz-head").inner_text()
        page.locator("kr-survival-kit-inventory-card .quiz-panel").scroll_into_view_if_needed()
        page.screenshot(path=str(EVIDENCE / "quiz-synthetic-desktop.jpg"), type="jpeg", quality=88)
        page.set_viewport_size({"width": 375, "height": 812})
        page.evaluate("document.body.style.zoom = '2'")
        assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth"), "quiz at 375px/200% overflow"
        page.locator("kr-survival-kit-inventory-card .quiz-question").scroll_into_view_if_needed()
        page.screenshot(path=str(EVIDENCE / "quiz-synthetic-mobile-zoom.jpg"), type="jpeg", quality=88)
        page.emulate_media(reduced_motion="reduce")
        assert page.locator("kr-survival-kit-inventory-card .ready-art").first.evaluate("el => getComputedStyle(el).animationName") == "none"
        render(make_snapshot(2))
        render(make_snapshot(24))
        assert page.locator("kr-survival-kit-inventory-card .mission-item.unlock .mission-art").first.evaluate("el => getComputedStyle(el).animationName") == "none"

        mixed = make_snapshot(2)
        mixed["summary"]["items"]["drinking-water"].update({
            "state": "needs_check", "stale": False, "unknown_date_quantity": 22000,
        })
        mixed["items"]["drinking-water"]["lots"].append({
            "lot_id": "기한 미확인 데모", "quantity": 22000, "expires_on": None,
        })
        render(mixed)
        assert ready.count() == 0
        mixed["summary"]["items"]["drinking-water"]["stale"] = True
        render(mixed)
        assert ready.count() == 0

        render(make_snapshot(2))
        page.locator('kr-survival-kit-inventory-card button[data-edit="drinking-water"]').click()
        target = page.locator("kr-survival-kit-inventory-card #editor #target")
        quantity = page.locator("kr-survival-kit-inventory-card #editor .quantity")
        received_on = page.locator("kr-survival-kit-inventory-card #editor .received-on")
        review = page.locator("kr-survival-kit-inventory-card #editor #review-interval")
        assert target.input_value() == "24"
        assert quantity.input_value() == "2"
        assert received_on.input_value() == "2026-11-01"
        assert review.input_value() == "45"
        target.fill("24.001")
        quantity.fill("4.25")
        review.fill("60")
        page.locator("kr-survival-kit-inventory-card [data-quiz-nav='next']").click()
        assert quantity.input_value() == "4.25", "Quiz navigation lost unsaved inventory"
        page.locator("kr-survival-kit-inventory-card [data-quiz-reset]").click()
        assert "학습 진도 0/8" in page.locator("kr-survival-kit-inventory-card .quiz-head").inner_text()
        assert page.evaluate("JSON.parse(localStorage.getItem('kr_survival_kit_quiz_v1')).answers") == {}
        assert target.input_value() == "24.001"
        assert review.input_value() == "60"
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
        assert received_on.input_value() == "2026-11-01"
        assert review.input_value() == "60"
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
        assert saved["lots"][0]["received_on"] == "2026-11-01", saved
        assert saved["review_interval_days"] == 60, saved

        browser.close()
    print("Synthetic complete-only 2D transitions, 10/2-column layouts, 200% zoom, L/ml edit/conflict, and screenshots passed")


if __name__ == "__main__":
    main()
