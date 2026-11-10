import copy
import json
import unittest

from scripts.build_guides import (
    CONTENT, ROOT, render_html, render_markdown, validate_catalog, validate_guide,
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


if __name__ == "__main__":
    unittest.main()
