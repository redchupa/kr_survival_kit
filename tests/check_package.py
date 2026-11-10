"""Check the repository layout used by HACS and the manual HA install."""

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COMPONENTS = ROOT / "custom_components"
INTEGRATION = COMPONENTS / "kr_survival_kit"


def main():
    hacs = json.loads((ROOT / "hacs.json").read_text(encoding="utf-8"))
    manifest = json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))
    assert hacs["name"] == manifest["name"]
    assert hacs["render_readme"] is True
    assert (ROOT / "README.md").is_file()
    assert [path.name for path in COMPONENTS.iterdir() if path.is_dir()] == ["kr_survival_kit"]
    for key in ("domain", "name", "documentation", "issue_tracker", "codeowners", "version"):
        assert key in manifest, key
    assert manifest["domain"] == INTEGRATION.name
    assert re.fullmatch(r"\d+\.\d+\.\d+", manifest["version"])
    assert (INTEGRATION / "content" / "guide.ko.json").is_file()
    assert (INTEGRATION / "www" / "kr-survival-kit-card.js").is_file()
    assert (ROOT / "LICENSE").is_file()
    print("HACS layout and manifest checks passed")


if __name__ == "__main__":
    main()
