"""Check the built HTML and PDF using an isolated offline browser."""

import argparse
import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output"
GUIDE = ROOT / "custom_components/kr_survival_kit/content/guide.ko.json"


def verify_html(guide, browser_path):
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=browser_path)
        try:
            page = browser.new_page(offline=True, viewport={"width": 375, "height": 812})
            requests = []
            page.on("request", lambda request: requests.append(request.url))
            page.goto((OUTPUT / "offline.html").as_uri())
            comms = page.locator(".hero .comms")
            assert comms.is_visible()
            assert guide["communication_loss"]["first_action"] in comms.inner_text()
            page.keyboard.press("Tab")
            assert page.locator(".skip").evaluate("el => el === document.activeElement")
            page.keyboard.press("Enter")
            assert page.url.endswith("#scenarios")
            for item in guide["scenarios"]:
                card = page.locator(f'#{item["id"]}')
                assert card.is_visible()
                assert card.locator(".first").inner_text() == item["first_action"]
            for scheme in ("dark", "light"):
                page.emulate_media(color_scheme=scheme)
                assert page.evaluate("document.documentElement.scrollWidth === innerWidth"), scheme
            page.add_style_tag(content="html { font-size: 200%; }")
            assert page.evaluate("document.documentElement.scrollWidth === innerWidth"), "200% text size"
            assert not [url for url in requests if not url.startswith("file:")], requests

            plain_page = browser.new_page(offline=True, java_script_enabled=False)
            plain_page.goto((OUTPUT / "offline.html").as_uri())
            assert plain_page.get_by_role("heading", name="가정 비상 안내", exact=True).is_visible()
        finally:
            browser.close()


def compact(text):
    return "".join(text.split())


def verify_pdf(guide):
    pdf = PdfReader(OUTPUT / "pdf" / "kr-survival-kit-a4.pdf")
    assert len(pdf.pages) == 2
    for page in pdf.pages:
        assert abs(float(page.mediabox.width) - 595.28) < 2
        assert abs(float(page.mediabox.height) - 841.89) < 2
        for ref in page["/Resources"]["/Font"].values():
            font = ref.get_object()
            if "/DescendantFonts" in font:
                font = font["/DescendantFonts"][0].get_object()
            descriptor = font["/FontDescriptor"].get_object()
            assert any(key in descriptor for key in ("/FontFile", "/FontFile2", "/FontFile3")), font

    action_text, household_text = (page.extract_text() for page in pdf.pages)
    assert not re.search(r"\[\s*\d+(?:\s*,\s*\d+)*\s*\]", action_text)
    assert not re.search(r"(?<!\d)(?:123|119)(?!\d)", action_text)
    action_page, household_page = compact(action_text), compact(household_text)
    assert compact(guide["official_first"]) in action_page
    comms = guide["communication_loss"]
    assert action_page.index(compact(comms["first_action"])) < action_page.index("공습경보")
    assert compact(comms["paper_note"]) in action_page
    assert "국민안전24비상대비" in action_page
    for item in guide["scenarios"]:
        assert compact(item["first_action"]) in action_page, item["id"]
        assert compact(item["paper_note"]) in action_page, item["id"]
    fields = (
        "대피소 1", "대피소 2", "전화 없이 만나는 약속", "기본 집결 장소",
        "기본 장소에 갈 수 없을 때 만날 곳", "대피소·연락처 확인일",
    )
    for field in fields:
        assert compact(field) in household_page, field


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", help="path to an installed Chromium-family browser")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    content = json.loads(GUIDE.read_text(encoding="utf-8"))
    verify_html(content, args.browser)
    verify_pdf(content)
    print("검증 통과 · 오프라인 HTML, 375px, 키보드, 글자 200%, A4 2쪽, 내장 글꼴, 한글 추출")
