import copy
import json
import unittest

from scripts.build_guides import CONTENT, validate_guide, validate_quiz


class QuizTests(unittest.TestCase):
    def setUp(self):
        self.guide = json.loads((CONTENT / "guide.ko.json").read_text(encoding="utf-8"))
        self.quiz = json.loads((CONTENT / "quiz.ko.json").read_text(encoding="utf-8"))

    def test_questions_reference_current_scenarios_and_sources(self):
        validate_guide(self.guide)
        validate_quiz(self.quiz, self.guide)
        self.assertEqual(len(self.quiz["questions"]), 8)
        self.assertEqual(len(self.quiz["levels"]), 3)
        self.assertIn("학습 진도", self.quiz["intro"])
        self.assertIn("실제 생존 가능성이나 대피 판단 점수가 아닙니다", self.quiz["intro"])
        self.assertNotIn("%", json.dumps(self.quiz, ensure_ascii=False))
        self.assertGreater(
            len({question["answer_id"] for question in self.quiz["questions"]}),
            1,
        )
        self.assertGreater(
            len({next(i for i, choice in enumerate(question["choices"]) if choice["id"] == question["answer_id"])
                 for question in self.quiz["questions"]}),
            1,
        )

    def test_unknown_scenario_or_source_is_rejected(self):
        for field, value, message in (
            ("scenario_id", "invented-scenario", "Unknown guide scenario"),
            ("source_ids", ["invented-source"], "known source"),
        ):
            with self.subTest(field=field):
                changed = copy.deepcopy(self.quiz)
                changed["questions"][0][field] = value
                with self.assertRaisesRegex(ValueError, message):
                    validate_quiz(changed, self.guide)

    def test_answer_and_level_must_match(self):
        for field, value, message in (
            ("answer_id", "missing", "no matching answer"),
            ("level_id", "missing", "Unknown quiz level"),
        ):
            with self.subTest(field=field):
                changed = copy.deepcopy(self.quiz)
                changed["questions"][0][field] = value
                with self.assertRaisesRegex(ValueError, message):
                    validate_quiz(changed, self.guide)

    def test_release_requires_human_review(self):
        with self.assertRaisesRegex(ValueError, "quiz is awaiting human review"):
            validate_quiz(self.quiz, self.guide, release=True)


if __name__ == "__main__":
    unittest.main()
