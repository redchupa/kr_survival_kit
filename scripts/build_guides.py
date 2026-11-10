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
        if sheet.get("layout", "timeline") not in ("timeline", "matrix"):
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
        if item["unit"] not in {"ml", "개"} or item["date_kind"] not in {"expiry", "inspection"}:
            raise ValueError(f"Invalid unit or date kind for {key}")
        source_refs(item["source_ids"], sources, key)
    if not seen:
        raise ValueError("Catalog must include at least one item")


def guide_stamp(guide):
    scenarios = [*guide["scenarios"], guide["communication_loss"], *guide["playbook"], guide["paper_checkpoints"]]
    if all(item["review_status"] == "reviewed" for item in scenarios):
        last_review = max(item["reviewed_on"] for item in scenarios)
        status = f"최근 문구 검토 {last_review}"
    else:
        status = "공개 전 검토용"
    last_check = max(source["checked_on"] for source in guide["sources"].values())
    return f"안내 버전 {guide['content_version']} · {status} · 최근 출처 확인 {last_check}"


def source_links(sources, refs):
    return " · ".join(
        f'<a href="{escape(sources[ref]["url"], quote=True)}">'
        f'{escape(sources[ref]["publisher"])} {escape(sources[ref]["title"])}</a>'
        for ref in refs
    )


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
        else:
            rows = "".join(
                f'<li class="timeline-row"><p class="when">{escape(row["when"])}</p>'
                f'<div><h3>{escape(row["title"])}</h3><p>{escape(row["text"])}</p></div></li>'
                for row in sheet["rows"]
            )
            content = f'<ol class="timeline">{rows}</ol>'
        refs = source_links(guide["sources"], sheet["source_ids"])
        sections.append(
            f'<article class="timeline-sheet" id="{key}" aria-labelledby="{key}-title">'
            f'<header class="sheet-head"><p class="kicker">{escape(sheet["label"])}</p>'
            f'<h2 id="{key}-title">{escape(sheet["title"])}</h2><p>{escape(sheet["intro"])}</p></header>'
            f'{content}'
            f'<footer class="sheet-foot"><p class="references">참고 자료 · {refs}</p></footer></article>'
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
        refs = item["source_ids"]
        links = " · ".join(
            f'<a href="#source-{ref}">{escape(sources[ref]["title"])}</a>' for ref in refs
        )
        details = "".join(f"<li>{escape(detail)}</li>" for detail in item["details"])
        detail_list = f"<ul>{details}</ul>" if details else ""
        review = item["reviewed_on"] or "문구 검토 대기"
        index_links.append(f'<a href="#{key}">{title}</a>')
        cards.append(
            f'<article class="card" id="{key}" tabindex="-1" aria-labelledby="{key}-title">'
            f'<p class="kicker">{escape(item["kind"])}</p>'
            f'<h3 id="{key}-title">{title}</h3>'
            f'<p class="first">{action}</p>{detail_list}'
            f'<p class="references">출처 {links} · {escape(review)}</p></article>'
        )
        if key in PAPER_SCENARIOS:
            paper[key] = (
                f'<article class="print-row"><h3>{title}</h3>'
                f'<p class="first">{action}</p>'
                f'<p>{escape(item["paper_note"])}</p></article>'
            )

    screen_sources = []
    for key, source in sources.items():
        name = escape(f"{source['publisher']} {source['title']}")
        url = escape(source["url"], quote=True)
        description = escape(f"{source['section']} · 확인 {source['checked_on']}")
        screen_sources.append(f'<li id="source-{key}"><a href="{url}">{name}</a><span>{description}</span></li>')

    template = Template((SCRIPTS / "offline.html").read_text(encoding="utf-8"))
    return template.substitute(
        styles=(SCRIPTS / "guide.css").read_text(encoding="utf-8"),
        official_first=escape(guide["official_first"]),
        comms_title=escape(comms["title"]),
        comms_action=escape(comms["first_action"]),
        comms_note=escape(comms["paper_note"]),
        comms_sources=" · ".join(
            f'<a href="#source-{ref}">{escape(sources[ref]["title"])}</a>' for ref in comms["source_ids"]
        ),
        stamp=escape(guide_stamp(guide)),
        index="\n".join(index_links),
        cards="\n".join(cards),
        print_rows="\n".join(paper[key] for key in PAPER_SCENARIOS),
        screen_sources="\n".join(screen_sources),
        print_sources=source_links(sources, checkpoints["source_ids"]),
        print_condition=escape(checkpoints["condition"]),
        print_checkpoints="".join(
            f'<div><dt>{escape(row["when"])}</dt><dd>{escape(row["text"])}</dd></div>'
            for row in checkpoints["rows"]
        ),
        playbook=render_playbook(guide),
    )


def render_markdown(guide):
    lines = [
        "# 가정 비상 안내", "", f"**{escape(guide['official_first'])}**",
        "", escape(guide_stamp(guide)), "",
    ]
    for item in [guide["communication_loss"], *guide["scenarios"]]:
        lines.extend([f"## {escape(item['title'])}", "", f"**{escape(item['first_action'])}**", ""])
        if "details" in item:
            lines.extend(f"- {escape(detail)}" for detail in item["details"])
        else:
            lines.append(escape(item["paper_note"]))
        refs = []
        for key in item["source_ids"]:
            source = guide["sources"][key]
            label = escape(f"{source['publisher']} {source['title']}")
            refs.append(f"[{label}](<{source['url']}>)")
        lines.extend(["", " · ".join(refs), ""])
    for sheet in guide["playbook"]:
        lines.extend([f"## {escape(sheet['title'])}", "", escape(sheet["intro"]), ""])
        for row in sheet["rows"]:
            lines.append(f"- **{escape(row['when'])} · {escape(row['title'])}** {escape(row['text'])}")
        refs = []
        for key in sheet["source_ids"]:
            source = guide["sources"][key]
            refs.append(f"[{escape(source['publisher'])} {escape(source['title'])}](<{source['url']}>)")
        lines.extend(["", " · ".join(refs), ""])
    return "\n".join(lines)


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
        catalog = json.loads((CONTENT / "catalog.ko.json").read_text(encoding="utf-8"))
        validate_guide(guide, release=args.release)
        validate_catalog(catalog, guide["sources"])
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
