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
    for name in ("catalog", "household", "guide", "quiz"):
        assert json.loads((INTEGRATION / "content" / f"{name}.ko.json").read_text(encoding="utf-8"))
    for locale in ("ko", "en"):
        strings = json.loads((INTEGRATION / "translations" / f"{locale}.json").read_text(encoding="utf-8"))
        assert strings["config"]["step"]["user"]["data"]["inspection_days"] == "기본 재고 점검 주기 (일)"
        assert strings["config"]["abort"]["incomplete_install"]
    assert (INTEGRATION / "www" / "kr-survival-kit-card.js").is_file()
    card = (INTEGRATION / "www" / "kr-survival-kit-card.js").read_text(encoding="utf-8")
    # The 3D module is imported with this cache-busting version; a stale value keeps old 3D code in browsers.
    assert f'const KR_ASSET_VERSION = "{manifest["version"]}";' in card, "KR_ASSET_VERSION must match manifest version"
    assert (INTEGRATION / "www" / "kr-survival-kit-a4.pdf").read_bytes().startswith(b"%PDF-")
    guide = json.loads((INTEGRATION / "content/guide.ko.json").read_text(encoding="utf-8"))
    assert guide["content_version"] in (INTEGRATION / "www" / "kr-survival-kit-offline.html").read_text(encoding="utf-8")
    assert (ROOT / "LICENSE").is_file()
    print("HACS layout and manifest checks passed")


if __name__ == "__main__":
    main()
