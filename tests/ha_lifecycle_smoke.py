"""Install, update from P4, and remove in disposable Home Assistant configs."""

import asyncio
import argparse
import io
import json
import logging
import shutil
import subprocess
import tarfile
import tempfile
from pathlib import Path

from homeassistant.core import Context

from ha_smoke import DOMAIN, SOURCE, start_ha


def install_p4(config_dir):
    archive = subprocess.check_output(
        ["git", "archive", "4d622b6", "custom_components/kr_survival_kit"],
        cwd=SOURCE.parents[1],
    )
    with tarfile.open(fileobj=io.BytesIO(archive)) as files:
        files.extractall(config_dir, filter="data")


async def add_entry(hass):
    flow = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "user"}, data={"inspection_days": 30}
    )
    assert flow["type"] == "create_entry", flow
    await hass.async_block_till_done()
    return flow["result"]


async def exercise(config_dir, *, update):
    import custom_components
    custom_components.__path__[:] = [path for path in custom_components.__path__
                                    if Path(path).exists()]
    destination = Path(config_dir) / "custom_components" / DOMAIN
    if update:
        install_p4(config_dir)
    else:
        shutil.copytree(SOURCE, destination, ignore=shutil.ignore_patterns("__pycache__"))
    hass = await start_ha(config_dir)
    entry = await add_entry(hass)
    admin = await hass.auth.async_create_user("P5 Test Admin", group_ids=["system-admin"])
    context = Context(user_id=admin.id)
    response = await hass.services.async_call(
        DOMAIN, "set_item",
        {"item_id": "drinking-water", "revision": 0, "applicable": True,
         "target": 1000, "lots": [], "confirm": True},
        blocking=True, return_response=True, context=context,
    )
    assert response["revision"] == 1
    await hass.async_stop()

    if update:
        shutil.copytree(SOURCE, destination, dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns("__pycache__"))
    hass = await start_ha(config_dir)
    restored = hass.config_entries.async_get_entry(entry.entry_id)
    assert restored and restored.runtime_data.snapshot["revision"] == 1
    assert restored.runtime_data.snapshot["items"]["drinking-water"]["target"] == 1000
    assert len([state for state in hass.states.async_all("sensor")
                if state.attributes.get("friendly_name") in
                {"부족한 품목", "확인할 품목", "기한 임박 품목"}]) == 3
    assert await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert not hass.config_entries.async_entries(DOMAIN)
    assert not hass.services.has_service(DOMAIN, "get_inventory")
    await hass.async_stop()


async def main():
    logging.basicConfig(level=logging.ERROR)
    parser = argparse.ArgumentParser()
    parser.add_argument("--from-p4", action="store_true")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="kr-survival-p5-") as config_dir:
        await exercise(config_dir, update=args.from_p4)
    print(json.dumps({"candidate": "installed_and_removed",
                      "p4_update": args.from_p4}))


if __name__ == "__main__":
    asyncio.run(main())
