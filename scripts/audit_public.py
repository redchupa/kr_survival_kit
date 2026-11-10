"""Report likely personal data locations without printing their contents."""

import re
import subprocess
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    "email": re.compile(rb"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "mobile": re.compile(rb"(?<!\d)01[016789][- .]?\d{3,4}[- .]?\d{4}(?!\d)"),
    "resident_number": re.compile(rb"(?<!\d)\d{6}[- ]?[1-8]\d{6}(?!\d)"),
    "user_path": re.compile(rb"(?:[A-Za-z]:\\" + rb"Users\\|/" + rb"Users/|/" + rb"home/)[^\s\"']+"),
}


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def scan(label, content, findings):
    for kind, pattern in PATTERNS.items():
        if pattern.search(content):
            findings.add((label, kind))


def main():
    findings = set()
    revisions = git("rev-list", "--all").decode().splitlines()
    checked = 0
    for revision in revisions:
        paths = git("ls-tree", "-r", "--name-only", revision).decode().splitlines()
        for path in paths:
            scan(f"{revision[:7]}:{path}", git("show", f"{revision}:{path}"), findings)
            checked += 1
    paths = git("ls-files", "--cached", "--others", "--exclude-standard").decode().splitlines()
    for path in paths:
        file = ROOT / path
        if file.is_file():
            scan(f"working:{path}", file.read_bytes(), findings)
            checked += 1
    for file in (ROOT / "output").rglob("*"):
        if file.is_file() and file.suffix.lower() in {".html", ".yaml", ".md", ".js", ".json"}:
            scan(f"artifact:{file.relative_to(ROOT)}", file.read_bytes(), findings)
            checked += 1
        elif file.is_file() and file.suffix.lower() == ".pdf":
            document = PdfReader(file)
            content = "\n".join(page.extract_text() or "" for page in document.pages)
            content += "\n" + str(document.metadata or {})
            scan(f"artifact:{file.relative_to(ROOT)}", content.encode("utf-8"), findings)
            checked += 1
    print(f"Scanned {len(revisions)} revisions and {checked} file versions")
    for label, kind in sorted(findings):
        print(f"REVIEW {kind}: {label}")
    if not findings:
        print("No pattern matches")
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
