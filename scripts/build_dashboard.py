"""Build the two full-width Home Assistant views from reviewed guide data."""

import json

from build_guides import CONTENT, OUTPUT, household_summary, validate_guide


def block(value, spaces=14):
    return "\n".join(" " * spaces + line for line in value.splitlines())


def main():
    guide = json.loads((CONTENT / "guide.ko.json").read_text(encoding="utf-8"))
    validate_guide(guide)
    summary = household_summary()
    guide_payload = json.dumps({
        "official_first": guide["official_first"],
        "communication_loss": guide["communication_loss"],
        "scenarios": guide["scenarios"],
        "playbook": guide["playbook"],
        "sources": guide["sources"],
        "household_summary": summary,
    }, ensure_ascii=False, separators=(",", ":"))
    yaml = (
        f"# content_version: {guide['content_version']}\n"
        "title: KR Survival Kit\nviews:\n"
        "  - title: 비축 관리\n    path: home\n    type: panel\n    cards:\n"
        "      - type: custom:kr-survival-kit-inventory-card\n"
        "        guide_path: /kr-survival-kit/guide\n"
        + "  - title: 상황 안내\n    path: guide\n    type: panel\n    cards:\n"
        + "      - type: custom:kr-survival-kit-guide-card\n"
        + "        guide_data: >-\n"
        + block(guide_payload, 10) + "\n"
    )
    OUTPUT.mkdir(parents=True, exist_ok=True)
    target = OUTPUT / "dashboard.yaml"
    target.write_text(yaml, encoding="utf-8", newline="\n")
    print(target)


if __name__ == "__main__":
    main()
