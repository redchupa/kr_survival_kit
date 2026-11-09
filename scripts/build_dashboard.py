"""Build a Sections dashboard from the reviewed guide source."""

import json
from pathlib import Path

from build_guides import CONTENT, OUTPUT, render_markdown


def block(value, spaces):
    return "\n".join(" " * spaces + line for line in value.splitlines())


def main():
    guide = json.loads((CONTENT / "guide.ko.json").read_text(encoding="utf-8"))
    guidance = render_markdown(guide)
    intro = (
        "# 가정 비상 안내\n\n"
        f"**{guide['official_first']}**\n\n"
        "전화·인터넷이 끊기면 현장 방송과 건전지 라디오로 안내를 확인하세요. "
        "안내가 들리지 않아도 경보 해제로 판단하지 마세요.\n\n"
        "[상황별 행동요령 열기](/kr-survival-kit/guide)\n\n"
        "[인쇄용 A4 PDF 저장](/local/kr-survival-kit-a4.pdf) · "
        "[오프라인 HTML 저장](/local/kr-survival-kit-offline.html)\n\n"
        f"안내 버전 {guide['content_version']} · 종이판도 같은 버전인지 확인하세요."
    )
    yaml = (
        "title: KR Survival Kit\n"
        "views:\n"
        "  - title: 비상 대비\n"
        "    path: home\n"
        "    type: sections\n"
        "    max_columns: 2\n"
        "    sections:\n"
        "      - type: grid\n"
        "        title: 지금 확인\n"
        "        cards:\n"
        "          - type: markdown\n"
        "            content: |\n"
        f"{block(intro, 14)}\n"
        "      - type: grid\n"
        "        title: 평시 준비\n"
        "        cards:\n"
        "          - type: tile\n"
        "            entity: sensor.bujoghan_pummog\n"
        "            name: 부족한 품목\n"
        "            grid_options:\n"
        "              columns: 12\n"
        "          - type: tile\n"
        "            entity: sensor.hwaginhal_pummog\n"
        "            name: 확인할 품목\n"
        "            grid_options:\n"
        "              columns: 12\n"
        "          - type: tile\n"
        "            entity: sensor.gihan_imbag_pummog\n"
        "            name: 기한 임박 품목\n"
        "            grid_options:\n"
        "              columns: 12\n"
        "          - type: custom:kr-survival-kit-inventory-card\n"
        "  - title: 상황 안내\n"
        "    path: guide\n"
        "    type: sections\n"
        "    sections:\n"
        "      - type: grid\n"
        "        title: 상황별 행동요령\n"
        "        cards:\n"
        "          - type: markdown\n"
        "            content: |\n"
        f"{block(guidance, 14)}\n"
    )
    OUTPUT.mkdir(parents=True, exist_ok=True)
    target = OUTPUT / "dashboard.yaml"
    target.write_text(yaml, encoding="utf-8", newline="\n")
    print(target)


if __name__ == "__main__":
    main()
