"""Build the independent offline guide, HA Markdown, and optional A4 PDF."""

import argparse
import json
import re
from datetime import date
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import urlsplit

SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parent
CONTENT = ROOT / "custom_components" / "kr_survival_kit" / "content"
OUTPUT = ROOT / "output"
ID = re.compile(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*")
PAPER_SCENARIOS = ("air-raid", "nuclear-alert", "civil-warning", "cbrn-alert", "power-outage", "water-outage")


def line(value, field):
    if not isinstance(value, str) or not value.strip() or value.splitlines() != [value]:
        raise ValueError(f"{field} must be a non-empty single line")
    return value


def iso_date(value, field):
    try:
        if date.fromisoformat(value).isoformat() == value:
            return value
    except (TypeError, ValueError):
        pass
    raise ValueError(f"{field} must use YYYY-MM-DD")


def source_refs(refs, sources, field):
    if not isinstance(refs, list) or not refs or any(ref not in sources for ref in refs):
        raise ValueError(f"{field} must reference at least one known source")
    if len(refs) != len(set(refs)):
        raise ValueError(f"{field} contains a duplicate source")


def validate_review(item, key, release):
    status = item["review_status"]
    if status == "reviewed":
        iso_date(item["reviewed_on"], f"{key}.reviewed_on")
    elif status != "draft" or item["reviewed_on"] is not None:
        raise ValueError(f"Invalid review status or date for {key}")
    elif release:
        raise ValueError(f"Release blocked: {key} is awaiting human review")


def validate_guide(guide, release=False):
    if guide["schema_version"] != 1:
        raise ValueError("Unsupported guide schema")
    version = line(guide["content_version"], "content_version")
    line(guide["official_first"], "official_first")
    sources = guide["sources"]
    for source_id, source in sources.items():
        if not ID.fullmatch(source_id):
            raise ValueError(f"Invalid source ID {source_id}")
        for field in ("publisher", "title", "section"):
            line(source[field], f"{source_id}.{field}")
        iso_date(source["checked_on"], f"{source_id}.checked_on")
        if source_id == "project-example" and source["url"] == "":
            continue
        url = line(source["url"], f"{source_id}.url")
        parsed = urlsplit(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or re.search(r"[\s<>]", url):
            raise ValueError(f"Invalid HTTPS source URL for {source_id}")

    seen = set()
    for scenario in guide["scenarios"]:
        key = scenario["id"]
        if not ID.fullmatch(key) or key in seen:
            raise ValueError(f"Invalid or duplicate scenario ID {key}")
        seen.add(key)
        for field in ("title", "kind", "first_action", "paper_note"):
            line(scenario[field], f"{key}.{field}")
        if not isinstance(scenario["details"], list):
            raise ValueError(f"{key}.details must be a list")
        for detail in scenario["details"]:
            line(detail, f"{key}.details")
        source_refs(scenario["source_ids"], sources, key)
        validate_review(scenario, key, release)
    if not set(PAPER_SCENARIOS).union({"prepare"}).issubset(seen):
        raise ValueError("The guide must include all action card scenarios and prepare")
    comms = guide["communication_loss"]
    for field in ("title", "first_action", "paper_note"):
        line(comms[field], f"communication_loss.{field}")
    source_refs(comms["source_ids"], sources, "communication_loss")
    validate_review(comms, "communication_loss", release)
    playbook = guide["playbook"]
    if not isinstance(playbook, list) or not playbook:
        raise ValueError("The guide must include the timeline playbook")
    for sheet in playbook:
        key = sheet["id"]
        if not ID.fullmatch(key) or key in seen:
            raise ValueError(f"Invalid or duplicate playbook ID {key}")
        seen.add(key)
        for field in ("label", "title", "intro"):
            line(sheet[field], f"{key}.{field}")
        if sheet.get("layout", "timeline") not in ("timeline", "matrix", "reference"):
            raise ValueError(f"Unsupported playbook layout for {key}")
        if not isinstance(sheet["rows"], list) or not sheet["rows"]:
            raise ValueError(f"{key}.rows must be a nonempty list")
        for row in sheet["rows"]:
            for field in ("when", "title", "text"):
                line(row[field], f"{key}.{field}")
        source_refs(sheet["source_ids"], sources, key)
        validate_review(sheet, key, release)
    checkpoints = guide["paper_checkpoints"]
    line(checkpoints["condition"], "paper_checkpoints.condition")
    if not isinstance(checkpoints["rows"], list) or not checkpoints["rows"]:
        raise ValueError("paper_checkpoints.rows must be a nonempty list")
    for row in checkpoints["rows"]:
        line(row["when"], "paper_checkpoints.when")
        line(row["text"], "paper_checkpoints.text")
    source_refs(checkpoints["source_ids"], sources, "paper_checkpoints")
    validate_review(checkpoints, "paper_checkpoints", release)
    if release and not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError("Release blocked: content_version must be a release version")


def validate_quiz(quiz, guide, release=False):
    if quiz["schema_version"] != 1:
        raise ValueError("Unsupported quiz schema")
    if quiz["content_version"] != guide["content_version"]:
        raise ValueError("Quiz and guide content versions differ")
    for field in ("title", "intro"):
        line(quiz[field], f"quiz.{field}")
    validate_review(quiz, "quiz", release)
    if not isinstance(quiz["levels"], list) or not quiz["levels"]:
        raise ValueError("Quiz levels must be nonempty")
    levels = set()
    for level in quiz["levels"]:
        key = level["id"]
        if not ID.fullmatch(key) or key in levels:
            raise ValueError(f"Invalid or duplicate quiz level {key}")
        levels.add(key)
        for field in ("title", "description"):
            line(level[field], f"quiz.levels.{key}.{field}")
    questions = quiz["questions"]
    if not isinstance(questions, list) or not 5 <= len(questions) <= 8:
        raise ValueError("Quiz must contain 5 to 8 questions")
    scenarios = {item["id"]: item for item in guide["scenarios"]}
    sources = guide["sources"]
    seen = set()
    used_levels = set()
    for question in questions:
        key = question["id"]
        if not ID.fullmatch(key) or key in seen:
            raise ValueError(f"Invalid or duplicate quiz question {key}")
        seen.add(key)
        if question["level_id"] not in levels:
            raise ValueError(f"Unknown quiz level for {key}")
        used_levels.add(question["level_id"])
        if question["scenario_id"] not in scenarios:
            raise ValueError(f"Unknown guide scenario for {key}")
        line(question["prompt"], f"quiz.questions.{key}.prompt")
        source_refs(question["source_ids"], sources, f"quiz.questions.{key}")
        if any(not sources[ref]["url"] for ref in question["source_ids"]):
            raise ValueError(f"Quiz question {key} needs official linked sources")
        if not set(question["source_ids"]).intersection(scenarios[question["scenario_id"]]["source_ids"]):
            raise ValueError(f"Quiz question {key} needs a matching scenario source")
        choices = question["choices"]
        if not isinstance(choices, list) or len(choices) != 3:
            raise ValueError(f"Quiz question {key} needs three choices")
        choice_ids = set()
        for choice in choices:
            choice_id = choice["id"]
            if not ID.fullmatch(choice_id) or choice_id in choice_ids:
                raise ValueError(f"Invalid or duplicate quiz choice for {key}")
            choice_ids.add(choice_id)
            line(choice["text"], f"quiz.questions.{key}.choices.{choice_id}.text")
            line(choice["feedback"], f"quiz.questions.{key}.choices.{choice_id}.feedback")
        if question["answer_id"] not in choice_ids:
            raise ValueError(f"Quiz question {key} has no matching answer")
    if used_levels != levels:
        raise ValueError("Each quiz level must contain a question")


def validate_catalog(catalog, sources):
    if catalog["schema_version"] != 1:
        raise ValueError("Unsupported catalog schema")
    seen = set()
    for item in catalog["items"]:
        key = item["id"]
        if not ID.fullmatch(key) or key in seen:
            raise ValueError(f"Invalid or duplicate item ID {key}")
        seen.add(key)
        line(item["name"], f"{key}.name")
        if item["tier"] not in {"rotation", "owned", "household", "optional"}:
            raise ValueError(f"Invalid purchase priority for {key}")
        if item["unit"] not in {"ml", "kg", "개", "세트", "켤레"} or item["date_kind"] not in {"expiry", "inspection"}:
            raise ValueError(f"Invalid unit or date kind for {key}")
        for field in ("note", "examples"):
            if field in item:
                line(item[field], f"{key}.{field}")
        source_refs(item["source_ids"], sources, key)
    if not seen:
        raise ValueError("Catalog must include at least one item")


def guide_stamp(guide):
    scenarios = [*guide["scenarios"], guide["communication_loss"], *guide["playbook"], guide["paper_checkpoints"]]
    household = json.loads((CONTENT / "household.ko.json").read_text(encoding="utf-8"))
    validate_household(household)
    scenarios.append(household)
    if all(item["review_status"] == "reviewed" for item in scenarios):
        last_review = max(item["reviewed_on"] for item in scenarios)
        status = f"최근 문구 검토 {last_review}"
    else:
        status = "공개 전 검토용"
    last_check = max(source["checked_on"] for source in guide["sources"].values())
    return f"안내 버전 {guide['content_version']} · {status} · 최근 출처 확인 {last_check}"


def source_links(sources, refs, labels=None):
    labels = labels or {}
    return " · ".join(
        f'<a href="{escape(sources[ref]["url"], quote=True)}">'
        f'{escape(labels.get(ref, source_label(sources[ref])))}</a>'
        for ref in refs
    )


def source_label(source):
    publisher = source["publisher"]
    title = source["title"]
    return title if title.startswith(publisher) else f"{publisher} · {title}"


def render_playbook(guide):
    sections = []
    for sheet in guide["playbook"]:
        key = sheet["id"]
        if sheet.get("layout") == "matrix":
            rows = "".join(
                f'<tr><th scope="row">{escape(row["when"])}</th>'
                f'<td>{escape(row["title"])}</td><td>{escape(row["text"])}</td></tr>'
                for row in sheet["rows"]
            )
            content = (
                '<table class="switch-table"><thead><tr><th scope="col">상황</th>'
                '<th scope="col">즉시 행동</th><th scope="col">다음 확인과 전환 조건</th></tr></thead>'
                f'<tbody>{rows}</tbody></table>'
            )
        elif sheet.get("layout") == "reference":
            rows = "".join(
                f'<li class="reference-card"><p class="when">{escape(row["when"])}</p>'
                f'<h3>{escape(row["title"])}</h3><p>{escape(row["text"])}</p></li>'
                for row in sheet["rows"]
            )
            content = f'<ul class="reference-grid">{rows}</ul>'
        else:
            rows = "".join(
                f'<li class="timeline-row"><p class="when">{escape(row["when"])}</p>'
                f'<div><h3>{escape(row["title"])}</h3><p>{escape(row["text"])}</p></div></li>'
                for row in sheet["rows"]
            )
            content = f'<ol class="timeline">{rows}</ol>'
        sections.append(
            f'<article class="timeline-sheet" id="{key}" aria-labelledby="{key}-title">'
            f'<header class="sheet-head"><p class="kicker">{escape(sheet["label"])}</p>'
            f'<h2 id="{key}-title">{escape(sheet["title"])}</h2><p>{escape(sheet["intro"])}</p></header>'
            f'{content}</article>'
        )
    return "\n".join(sections)


def render_html(guide):
    scenarios = guide["scenarios"]
    comms = guide["communication_loss"]
    sources = guide["sources"]
    checkpoints = guide["paper_checkpoints"]
    index_links = []
    cards = []
    paper = {}
    for item in scenarios:
        key = item["id"]
        title = escape(item["title"])
        action = escape(item["first_action"])
        details = "".join(f"<li>{escape(detail)}</li>" for detail in item["details"])
        detail_list = f"<ul>{details}</ul>" if details else ""
        index_links.append(f'<a href="#{key}">{title}</a>')
        cards.append(
            f'<article class="card" id="{key}" tabindex="-1" aria-labelledby="{key}-title">'
            f'<p class="kicker">{escape(item["kind"])}</p>'
            f'<h3 id="{key}-title">{title}</h3>'
            f'<p class="first">{action}</p>{detail_list}</article>'
        )
        if key in PAPER_SCENARIOS:
            paper[key] = (
                f'<article class="print-row"><h3>{title}</h3>'
                f'<p class="first">{action}</p>'
                f'<p>{escape(item["paper_note"])}</p></article>'
            )

    screen_sources = []
    seen_urls = set()
    used_ids = set()
    for item in [comms, *scenarios, *guide["playbook"], checkpoints]:
        used_ids.update(item["source_ids"])
    all_sources = [(key, source) for key, source in sources.items() if key in used_ids]
    household_path = CONTENT / "household.ko.json"
    if household_path.exists():
        household_data = json.loads(household_path.read_text(encoding="utf-8"))
        validate_household(household_data)
        household_used = {ref for item in [*household_data["items"], *household_data.get("extended", []), *household_data["optional_items"]] for ref in item["source_ids"]}
        all_sources += [(f"household-{key}", {"publisher": "4인 가구 준비량", "title": source["title"], "url": source["url"], "section": source.get("detail", ""), "checked_on": ""}) for key, source in household_data["sources"].items() if source["url"] and key in household_used]
    for key, source in all_sources:
        if not source["url"]:
            continue
        canonical = source["url"].replace("https://www.", "https://", 1)
        if canonical in seen_urls:
            continue
        seen_urls.add(canonical)
        name = escape(source_label(source))
        url = escape(source["url"], quote=True)
        description = escape(source["section"] + (f" · 확인 {source['checked_on']}" if source["checked_on"] else ""))
        screen_sources.append(f'<li id="source-{key}"><a href="{url}">{name}</a><span>{description}</span></li>')

    template = Template((SCRIPTS / "offline.html").read_text(encoding="utf-8"))
    return template.substitute(
        styles=(SCRIPTS / "guide.css").read_text(encoding="utf-8"),
        official_first=escape(guide["official_first"]),
        comms_title=escape(comms["title"]),
        comms_action=escape(comms["first_action"]),
        comms_note=escape(comms["paper_note"]),
        household=render_household_html(),
        household_detail=render_household_detail(),
        household_paper=render_household_paper(),
        stamp=escape(guide_stamp(guide)),
        index="\n".join(index_links),
        cards="\n".join(cards),
        print_rows="\n".join(paper[key] for key in PAPER_SCENARIOS),
        screen_sources="\n".join(screen_sources),
        print_sources=source_links(sources, checkpoints["source_ids"], {
            "mois-2026": "행정안전부 2026 행동요령",
            "civil-preparedness": "국민안전24 비상대비",
            "civil-alerts": "민방공경보",
        }),
        print_condition=escape(checkpoints["condition"]),
        print_checkpoints="".join(
            f'<div><dt>{escape(row["when"])}</dt><dd>{escape(row["text"])}</dd></div>'
            for row in checkpoints["rows"]
        ),
        playbook=render_playbook(guide),
    )


def render_markdown(guide):
    return render_markdown_section(guide, "all")


def markdown_text(value):
    """Keep reviewed prose inert in Home Assistant's Markdown renderer."""
    return escape(value).replace("\\", "\\\\").replace("[", "\\[").replace("]", "\\]")


def render_markdown_section(guide, section, show_title=True):
    scenarios = guide["scenarios"]
    if section == "alerts":
        items = [guide["communication_loss"], *[item for item in scenarios if item["kind"] == "민방공 경보"]]
    elif section == "outages":
        items = [item for item in scenarios if item["kind"] == "생활 기반 장애"]
    elif section == "prepare":
        items = [item for item in scenarios if item["id"] == "prepare"]
    elif section in {sheet["id"] for sheet in guide["playbook"]}:
        items = []
    elif section == "sources":
        lines = (["### 공식 참고 자료", ""] if show_title else []) + ["외부 링크는 인터넷 연결이 필요합니다.", ""]
        seen_urls = set()
        used_ids = set()
        for item in [guide["communication_loss"], *guide["scenarios"], *guide["playbook"], guide["paper_checkpoints"]]:
            used_ids.update(item["source_ids"])
        source_list = [guide["sources"][key] for key in guide["sources"] if key in used_ids]
        household_path = CONTENT / "household.ko.json"
        if household_path.exists():
            household = json.loads(household_path.read_text(encoding="utf-8"))
            validate_household(household)
            for key, source in household["sources"].items():
                if source["url"] and any(key in item["source_ids"] for item in [*household["items"], *household.get("extended", []), *household["optional_items"]]):
                    source_list.append({"publisher": "4인 가구 준비량", **source})
        for source in source_list:
            if not source["url"]:
                continue
            canonical = source["url"].replace("https://www.", "https://", 1)
            if canonical in seen_urls:
                continue
            seen_urls.add(canonical)
            label = markdown_text(source_label(source))
            lines.append(f"- [{label}]({source['url']})")
        return "\n".join(lines)
    elif section == "all":
        sections = ("alerts", "outages", "prepare", *[sheet["id"] for sheet in guide["playbook"]], "sources")
        return f"# 가정 비상 안내\n\n**{markdown_text(guide['official_first'])}**\n\n" + "\n\n---\n\n".join(render_markdown_section(guide, name) for name in sections)
    else:
        raise ValueError(f"Unknown Markdown section: {section}")
    if items:
        lines = []
        for item in items:
            if show_title or item.get("id") != "prepare":
                lines.extend([f"### {markdown_text(item['title'])}", ""])
            lines.extend([f"**{markdown_text(item['first_action'])}**", ""])
            if "details" in item:
                lines.extend(f"- {markdown_text(detail)}" for detail in item["details"])
            else:
                lines.append(markdown_text(item["paper_note"]))
            lines.append("")
        return "\n".join(lines).rstrip()
    sheet = next(sheet for sheet in guide["playbook"] if sheet["id"] == section)
    lines = ([f"### {markdown_text(sheet['title'])}", ""] if show_title else []) + [markdown_text(sheet["intro"]), ""]
    for row in sheet["rows"]:
        lines.append(f"- **{markdown_text(row['when'])} · {markdown_text(row['title'])}** — {markdown_text(row['text'])}")
    return "\n".join(lines)


def household_summary():
    path = CONTENT / "household.ko.json"
    if not path.exists():
        raise FileNotFoundError(f"Required household targets missing: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    validate_household(data)
    return line(data["compact_summary"], "household.compact_summary")


def validate_household(data, release=False):
    if data["people"] != 4 or data["days"] != 3:
        raise ValueError("household target must describe four people for three days")
    for field in ("title", "summary", "compact_summary"):
        line(data[field], f"household.{field}")
    validate_review(data, "household", release)
    sources = data["sources"]
    if not isinstance(sources, dict) or not sources:
        raise ValueError("household.sources must be nonempty")
    for key, source in sources.items():
        if not ID.fullmatch(key):
            raise ValueError(f"Invalid household source ID {key}")
        line(source["title"], f"household.sources.{key}.title")
        if key == "project-example" and source["url"] == "":
            continue
        url = line(source["url"], f"household.sources.{key}.url")
        parsed = urlsplit(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or re.search(r"[\s<>]", url):
            raise ValueError(f"Invalid household source URL for {key}")
    if not isinstance(data["items"], list) or not data["items"]:
        raise ValueError("household.items must be nonempty")
    for item in data["items"]:
        for field in ("item_id", "label", "quantity", "basis"):
            line(item[field], f"household.items.{field}")
        source_refs(item["source_ids"], sources, f"household.items.{item['item_id']}")
    for item in data.get("extended", []):
        for field in ("label", "quantity", "basis"):
            line(item[field], f"household.extended.{field}")
        source_refs(item["source_ids"], sources, f"household.extended.{item['label']}")
    line(data["optional_intro"], "household.optional_intro")
    line(data["optional_safety"], "household.optional_safety")
    optional_ids = set()
    for item in data["optional_items"]:
        for field in ("item_id", "label", "quantity", "basis"):
            line(item[field], f"household.optional_items.{field}")
        if item["item_id"] in optional_ids:
            raise ValueError(f"Duplicate optional household item {item['item_id']}")
        optional_ids.add(item["item_id"])
        source_refs(item["source_ids"], sources, f"household.optional_items.{item['item_id']}")


def render_household_html():
    summary = household_summary()
    if not summary:
        return ""
    return f'<section class="household-target" aria-label="4인 가구 준비량"><p>{escape(summary)}</p></section>'


def render_household_detail():
    path = CONTENT / "household.ko.json"
    if not path.exists():
        return ""
    data = json.loads(path.read_text(encoding="utf-8"))
    validate_household(data)
    def table_rows(items):
        return "".join(
            f'<tr><th scope="row">{escape(item["label"])}</th>'
            f'<td data-label="준비량">{escape(item["quantity"])}</td>'
            f'<td data-label="계산과 조정">{escape(item["basis"])}</td></tr>'
            for item in items
        )
    basic = table_rows([*data["items"], *data.get("extended", [])])
    optional = table_rows(data["optional_items"])
    return (
        '<section class="section household-detail" id="household-targets" aria-labelledby="household-targets-title">'
        '<p class="kicker">02 / 물·식품·장비</p>'
        f'<h2 id="household-targets-title">{escape(data["title"])}</h2>'
        '<div class="table-scroll"><table><thead><tr><th scope="col">품목</th>'
        '<th scope="col">준비량</th><th scope="col">계산과 조정</th></tr></thead>'
        f'<tbody>{basic}</tbody></table></div>'
        f'<details class="optional-targets"><summary>선택 물품 {len(data["optional_items"])}개 · 필요한 가구만 확인</summary>'
        '<p>기본 해당 없음 · 가구에 필요한 품목만 선택하세요.</p>'
        f'<p>{escape(data["optional_intro"])}</p>'
        f'<p class="optional-safety">{escape(data["optional_safety"])}</p>'
        '<div class="table-scroll"><table><thead><tr><th scope="col">선택 물품</th>'
        '<th scope="col">준비량 예시</th><th scope="col">계산과 조정</th></tr></thead>'
        f'<tbody>{optional}</tbody></table></div></details></section>'
    )


def render_household_paper():
    summary = household_summary()
    return f'<p class="paper-target">{escape(summary)}</p>' if summary else ""


def render_pdf(html_path, browser_path):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as error:
        raise ValueError("Install the development dependencies to build a PDF") from error
    pdf = OUTPUT / "pdf" / "kr-survival-kit-a4.pdf"
    pdf.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=browser_path)
        try:
            page = browser.new_page(offline=True)
            page.goto(html_path.as_uri())
            page.pdf(path=pdf, prefer_css_page_size=True, print_background=True, tagged=True)
        finally:
            browser.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", action="store_true", help="also render the one-page A4 action card")
    parser.add_argument("--browser", help="path to an installed Chromium-family browser for PDF rendering")
    parser.add_argument("--release", action="store_true", help="require reviewed content and a release version")
    args = parser.parse_args()

    try:
        guide = json.loads((CONTENT / "guide.ko.json").read_text(encoding="utf-8"))
        quiz = json.loads((CONTENT / "quiz.ko.json").read_text(encoding="utf-8"))
        catalog = json.loads((CONTENT / "catalog.ko.json").read_text(encoding="utf-8"))
        validate_guide(guide, release=args.release)
        validate_quiz(quiz, guide, release=args.release)
        validate_catalog(catalog, guide["sources"])
        household_path = CONTENT / "household.ko.json"
        validate_household(json.loads(household_path.read_text(encoding="utf-8")), release=args.release)
        html = render_html(guide)
        markdown = render_markdown(guide)
    except (ValueError, TypeError, KeyError) as error:
        parser.exit(1, f"Guide validation failed: {error}\n")

    OUTPUT.mkdir(exist_ok=True)
    html_path = OUTPUT / "offline.html"
    html_path.write_text(html, encoding="utf-8", newline="\n")
    (OUTPUT / "ha-guide.md").write_text(markdown, encoding="utf-8", newline="\n")
    if args.pdf:
        render_pdf(html_path, args.browser)


if __name__ == "__main__":
    main()
