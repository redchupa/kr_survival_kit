"""Collect draft review assets without creating a publishable release."""

import hashlib
import json
import shutil
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "output" / "release-candidate"
FILES = {
    ROOT / "output" / "pdf" / "kr-survival-kit-a4.pdf": "kr-survival-kit-a4.pdf",
    ROOT / "output" / "offline.html": "kr-survival-kit-offline.html",
    ROOT / "output" / "dashboard.yaml": "dashboard.yaml",
    ROOT / "custom_components" / "kr_survival_kit" / "www" / "kr-survival-kit-card.js": "kr-survival-kit-card.js",
}


def main():
    guide = json.loads((ROOT / "custom_components" / "kr_survival_kit" / "content" / "guide.ko.json").read_text(encoding="utf-8"))
    version = guide["content_version"]
    if "draft" not in version:
        raise ValueError("This review bundle is for a draft content version only")
    for path in (ROOT / "output" / "offline.html", ROOT / "output" / "dashboard.yaml"):
        if version not in path.read_text(encoding="utf-8"):
            raise ValueError(f"Content version mismatch: {path}")
    pdf = PdfReader(ROOT / "output" / "pdf" / "kr-survival-kit-a4.pdf")
    if version not in "".join(page.extract_text() or "" for page in pdf.pages):
        raise ValueError("Content version mismatch: PDF")
    TARGET.mkdir(parents=True, exist_ok=True)
    hashes = []
    for source, name in FILES.items():
        if not source.is_file():
            raise FileNotFoundError(source)
        destination = TARGET / name
        shutil.copy2(source, destination)
        digest = hashlib.sha256(destination.read_bytes()).hexdigest()
        hashes.append(f"{digest}  {name}")
    (TARGET / "SHA256SUMS.txt").write_text("\n".join(hashes) + "\n", encoding="ascii")
    (TARGET / "REVIEW-ONLY.txt").write_text(
        f"KR Survival Kit {version}\nDRAFT REVIEW ONLY - DO NOT PUBLISH\n"
        "See docs/p5-validation.md for release blockers.\n", encoding="utf-8"
    )
    print(TARGET)


if __name__ == "__main__":
    main()
