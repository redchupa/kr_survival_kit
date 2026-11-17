import copy
import json
import re
import sys
import unittest

from scripts.build_guides import (
    CONTENT, ROOT, render_html, render_markdown, render_markdown_section,
    source_label, validate_catalog, validate_guide, validate_household,
)


class GuideTests(unittest.TestCase):
    def setUp(self):
        self.guide = json.loads((CONTENT / "guide.ko.json").read_text(encoding="utf-8"))

    def test_sources_and_catalog(self):
        validate_guide(self.guide)
        catalog = json.loads((CONTENT / "catalog.ko.json").read_text(encoding="utf-8"))
        validate_catalog(catalog, self.guide["sources"])
        item_ids = {item["id"] for item in catalog["items"]}
        fixture = json.loads((ROOT / "tests/fixtures/stock.json").read_text(encoding="utf-8"))
        self.assertIs(fixture["fixture_only"], True)
        self.assertTrue(all(item["item_id"] in item_ids for item in fixture["items"]))

    def test_missing_and_unknown_sources_fail(self):
        for refs in ([], ["invented-source"]):
            with self.subTest(refs=refs):
                self.guide["scenarios"][0]["source_ids"] = refs
                with self.assertRaisesRegex(ValueError, "known source"):
                    validate_guide(self.guide)

    def test_duplicate_scenarios_fail(self):
        self.guide["scenarios"].append(copy.deepcopy(self.guide["scenarios"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate scenario"):
            validate_guide(self.guide)

    def test_draft_requires_human_review_for_release(self):
        self.guide["content_version"] = "0.1.0-draft.test"
        for item in [*self.guide["scenarios"], self.guide["communication_loss"], *self.guide["playbook"], self.guide["paper_checkpoints"]]:
            item.update(review_status="draft", reviewed_on=None)
        with self.assertRaisesRegex(ValueError, "awaiting human review"):
            validate_guide(self.guide, release=True)
        for item in self.guide["scenarios"]:
            item["review_status"] = "reviewed"
            item["reviewed_on"] = "2026-11-09"
        with self.assertRaisesRegex(ValueError, "communication_loss is awaiting human review"):
            validate_guide(self.guide, release=True)
        self.guide["communication_loss"].update(review_status="reviewed", reviewed_on="2026-11-09")
        with self.assertRaisesRegex(ValueError, "first-day is awaiting human review"):
            validate_guide(self.guide, release=True)
        for sheet in self.guide["playbook"]:
            sheet.update(review_status="reviewed", reviewed_on="2026-11-09")
        with self.assertRaisesRegex(ValueError, "paper_checkpoints is awaiting human review"):
            validate_guide(self.guide, release=True)
        self.guide["paper_checkpoints"].update(review_status="reviewed", reviewed_on="2026-11-09")
        with self.assertRaisesRegex(ValueError, "release version"):
            validate_guide(self.guide, release=True)
        self.guide["content_version"] = "0.1.0"
        validate_guide(self.guide, release=True)

    def test_review_requires_real_date(self):
        self.guide["scenarios"][0].update(review_status="reviewed", reviewed_on="2026-02-30")
        with self.assertRaisesRegex(ValueError, "YYYY-MM-DD"):
            validate_guide(self.guide)

    def test_first_actions_match_and_outputs_are_deterministic(self):
        html = render_html(self.guide)
        markdown = render_markdown(self.guide)
        self.assertEqual(html, render_html(self.guide))
        self.assertEqual(markdown, render_markdown(self.guide))
        self.assertIn(self.guide["official_first"], html)
        self.assertIn(self.guide["official_first"], markdown)
        for item in self.guide["scenarios"]:
            self.assertIn(f'id="{item["id"]}"', html)
            expected = 1 if item["id"] == "prepare" else 2
            self.assertEqual(html.count(item["first_action"]), expected)
            self.assertIn(item["first_action"], markdown)
        for sheet in self.guide["playbook"]:
            self.assertIn(f'id="{sheet["id"]}"', html)
            for row in sheet["rows"]:
                self.assertIn(row["text"], html)
                self.assertIn(row["text"], markdown)

    def test_html_escapes_content(self):
        self.guide["scenarios"][0]["first_action"] = "<script>alert(1)</script>"
        html = render_html(self.guide)
        self.assertNotIn("<script>alert(1)</script>", html)
        self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", html)

    def test_communication_loss_is_sourced_and_precedes_scenarios(self):
        comms = self.guide["communication_loss"]
        for output in (render_html(self.guide), render_markdown(self.guide)):
            self.assertLess(output.index(comms["first_action"]), output.index("공습경보"))
            self.assertIn(comms["paper_note"], output)
        comms["source_ids"] = []
        with self.assertRaisesRegex(ValueError, "communication_loss must reference"):
            validate_guide(self.guide)

    def test_household_target_and_source_layout(self):
        household = json.loads((CONTENT / "household.ko.json").read_text(encoding="utf-8"))
        validate_household(household)
        draft_household = dict(household, review_status="draft", reviewed_on=None)
        with self.assertRaisesRegex(ValueError, "awaiting human review"):
            validate_household(draft_household, release=True)
        html = render_html(self.guide)
        for item in [*household["items"], *household.get("extended", [])]:
            self.assertIn(item["label"], html)
            self.assertIn(item["quantity"], html)
            self.assertIn(item["basis"], html)
        for item in household["optional_items"]:
            self.assertIn(item["label"], html)
            self.assertIn(item["quantity"], html)
        self.assertIn(household["optional_safety"], html)
        self.assertEqual(html.count(household["optional_intro"]), 1)
        self.assertIn("기본 해당 없음", html)
        self.assertIn('id="household-targets"', html)
        self.assertIn(household["compact_summary"], html)
        self.assertNotIn(household["summary"], html)
        self.assertEqual(html.count('class="screen-only section sources"'), 1)
        self.assertNotIn("문구 검토 대기", html)

    def test_markdown_sources_appear_only_at_end(self):
        markdown = render_markdown(self.guide)
        sources = render_markdown_section(self.guide, "sources")
        self.assertEqual(markdown.count("### 공식 참고 자료"), 1)
        self.assertNotIn("안내 버전", render_markdown_section(self.guide, "alerts"))
        self.assertNotIn("https://", render_markdown_section(self.guide, "alerts"))
        self.assertNotIn(self.guide["content_version"], render_markdown_section(self.guide, "sources"))
        self.assertNotIn("](<https://", markdown)
        self.assertNotIn("\\&", markdown)
        urls = re.findall(r"\]\((https://[^)]+)\)", sources)
        canonical = [url.replace("https://www.", "https://", 1) for url in urls]
        self.assertTrue(urls)
        self.assertEqual(len(canonical), len(set(canonical)))

    def test_dashboard_sections_can_use_section_title_once(self):
        prepare = render_markdown_section(self.guide, "prepare", show_title=False)
        first_sheet = self.guide["playbook"][0]
        sheet = render_markdown_section(self.guide, first_sheet["id"], show_title=False)
        sources = render_markdown_section(self.guide, "sources", show_title=False)
        self.assertNotIn("### 평시 준비", prepare)
        self.assertNotIn(f"### {first_sheet['title']}", sheet)
        self.assertNotIn("### 공식 참고 자료", sources)
        self.assertIn(first_sheet["intro"], sheet)
        self.assertIn("https://", sources)

    def test_dashboard_guide_card_uses_reviewed_actions(self):
        import subprocess
        import yaml

        subprocess.run([sys.executable, "scripts/build_dashboard.py"], cwd=ROOT, check=True, capture_output=True)
        config = yaml.safe_load((ROOT / "output" / "dashboard.yaml").read_text(encoding="utf-8"))
        guide_view = config["views"][1]
        self.assertEqual(guide_view["type"], "panel")
        card = guide_view["cards"][0]
        self.assertEqual(card["type"], "custom:kr-survival-kit-guide-card")
        payload = json.loads(card["guide_data"])
        self.assertEqual(payload["official_first"], self.guide["official_first"])
        self.assertEqual(
            [(item["id"], item["first_action"]) for item in payload["scenarios"]],
            [(item["id"], item["first_action"]) for item in self.guide["scenarios"]],
        )

    def test_source_label_does_not_repeat_publisher(self):
        self.assertEqual(
            source_label({"publisher": "행정안전부", "title": "행정안전부, 2026 행동요령"}),
            "행정안전부, 2026 행동요령",
        )

    def test_reference_guides_and_private_nearby_template(self):
        html = render_html(self.guide)
        markdown = render_markdown(self.guide)
        for sheet_id in ("equipment-use", "field-skills"):
            sheet = next(item for item in self.guide["playbook"] if item["id"] == sheet_id)
            self.assertEqual(sheet["layout"], "reference")
            self.assertIn(f'id="{sheet_id}"', html)
            for row in sheet["rows"]:
                self.assertIn(row["title"], html)
                self.assertIn(row["text"], markdown)

        offline_template = (ROOT / "scripts/offline.html").read_text(encoding="utf-8")
        self.assertIn('id="nearby"', offline_template)
        for name in ("약국", "지하철역", "마트", "편의점"):
            self.assertIn(name, offline_template)
        self.assertNotIn("시흥 은계", offline_template)

    def test_discovery_topics_use_primary_sources(self):
        field = next(item for item in self.guide["playbook"] if item["id"] == "field-skills")
        equipment = next(item for item in self.guide["playbook"] if item["id"] == "equipment-use")
        self.assertIn("cdc-cold", field["source_ids"])
        self.assertIn("noaa-seawater", equipment["source_ids"])
        self.assertTrue(any("젖은 옷" in row["text"] for row in field["rows"]))
        self.assertTrue(any("바닷물은 마시지 마세요" in row["text"] for row in equipment["rows"]))
        for source_id in ("cdc-cold", "noaa-seawater"):
            self.assertNotIn("youtube.com", self.guide["sources"][source_id]["url"])

    def test_three_day_example_keeps_official_long_term_advice_visible(self):
        prepare = next(item for item in self.guide["scenarios"] if item["id"] == "prepare")
        self.assertIn("supplies", prepare["source_ids"])
        self.assertIn("30일분", self.guide["sources"]["supplies"]["section"])
        self.assertIn("15개 이상", self.guide["sources"]["supplies"]["section"])
        detail = next(item for item in prepare["details"] if "4인·3일" in item)
        self.assertIn("30일분", detail)
        self.assertIn("15개 이상", detail)
        self.assertIn("자동 적용하지 않습니다", detail)
        self.assertIn(detail, render_html(self.guide))

    def test_printed_five_minute_check_is_limited_and_legible(self):
        html = render_html(self.guide)
        css = (ROOT / "scripts/guide.css").read_text(encoding="utf-8")
        self.assertIn('class="paper-start"', html)
        self.assertIn("첫 5분 행동 점검", html)
        self.assertIn("전체 비축품을 5분 안에 갖춘다는 뜻이 아닙니다", html)
        self.assertIn("찾느라 대피를 늦추지 마세요", html)
        self.assertEqual(html.count('class="paper-start-list"'), 1)
        for number in ("01", "02", "03"):
            self.assertIn(f"{number}　", html)
        self.assertIn("print-color-adjust: exact", css)
        self.assertIn("border-left: 4pt solid var(--print-accent)", css)
        footer = html.split('<p class="references">', 1)[1].split("</p>", 1)[0]
        self.assertIn("국민안전24 비상대비", footer)
        self.assertIn("민방공경보", footer)
        self.assertNotIn("국민안전24 · 민방공경보", footer)


if __name__ == "__main__":
    unittest.main()
