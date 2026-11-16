"""Build a responsive Home Assistant Sections dashboard from reviewed guide data."""

import json

from build_guides import CONTENT, OUTPUT, household_summary, render_markdown_section, validate_guide


def block(value, spaces=14):
    return "\n".join(" " * spaces + line for line in value.splitlines())


def markdown_card(content):
    return "          - type: markdown\n            content: |\n" + block(content) + "\n"


def button(name, icon, action, path):
    target = "navigation_path" if action == "navigate" else "url_path"
    return (
        "          - type: button\n"
        f"            name: {name}\n"
        f"            icon: {icon}\n"
        "            show_state: false\n"
        "            tap_action:\n"
        f"              action: {action}\n"
        f"              {target}: {path}\n"
    )


def section(title, cards):
    return "      - type: grid\n" + f"        title: {title}\n" + "        cards:\n" + "".join(cards)


def main():
    guide = json.loads((CONTENT / "guide.ko.json").read_text(encoding="utf-8"))
    validate_guide(guide)
    summary = household_summary()
    urgent = (
        f"**{guide['official_first']}**\n\n"
        "경보에 맞는 가까운 보호 장소로 이동하세요. 준비물이나 가족과의 합류 때문에 대피를 늦추지 마세요.\n\n"
        "전화·인터넷이 끊기면 현장 방송이나 건전지 라디오로 안내를 확인하세요."
    )
    prepare = (
        "대피소 두 곳과 가족 연락 약속을 종이에 적고, 물·식품·필수약을 점검하세요."
        + (f"\n\n{summary}" if summary else "")
    )
    files = (
        "**파일을 여는 방법**  아래 버튼은 파일을 엽니다. PDF는 열린 화면의 인쇄·다운로드로 저장하고, "
        "HTML은 브라우저의 ‘다른 이름으로 저장’으로 보관하세요. 휴대전화에서는 공유 메뉴에 저장 옵션이 있을 수 있습니다."
    )
    guide_sections = [
        section("대피 우선", [markdown_card(urgent)]),
        section("인쇄·오프라인", [
            button("A4 인쇄 카드 열기", "mdi:file-pdf-box", "url", "/local/kr-survival-kit-a4.pdf"),
            button("오프라인 안내 열기", "mdi:file-document-outline", "url", "/local/kr-survival-kit-offline.html"),
            markdown_card(files),
        ]),
        section("평시 준비", [markdown_card(prepare)]),
        section("경보·통신 두절", [markdown_card(render_markdown_section(guide, "alerts"))]),
        section("정전·단수", [markdown_card(render_markdown_section(guide, "outages"))]),
        section("평시 준비 점검", [markdown_card(render_markdown_section(guide, "prepare", show_title=False))]),
    ]
    for sheet in guide["playbook"]:
        guide_sections.append(section(sheet["title"], [markdown_card(render_markdown_section(guide, sheet["id"], show_title=False))]))
    guide_sections.append(section("참고 자료", [markdown_card(render_markdown_section(guide, "sources", show_title=False))]))
    yaml = (
        f"# content_version: {guide['content_version']}\n"
        "title: KR Survival Kit\nviews:\n"
        "  - title: 비축 관리\n    path: home\n    type: panel\n    cards:\n"
        "      - type: custom:kr-survival-kit-inventory-card\n"
        "        guide_path: /kr-survival-kit/guide\n"
        + "  - title: 상황 안내\n    path: guide\n    type: sections\n    max_columns: 2\n    sections:\n"
        + "".join(guide_sections)
    )
    OUTPUT.mkdir(parents=True, exist_ok=True)
    target = OUTPUT / "dashboard.yaml"
    target.write_text(yaml, encoding="utf-8", newline="\n")
    print(target)


if __name__ == "__main__":
    main()
