"""Run an isolated Home Assistant dashboard for visual review."""

import asyncio
import argparse
import logging
import shutil
import subprocess
import tempfile
from pathlib import Path

import yaml

from homeassistant import bootstrap, loader
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component


ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "kr_survival_kit"


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--broker-down", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.WARNING)
    broker = None
    if args.broker_down:
        broker = subprocess.Popen(["mosquitto", "-p", "18887"],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        await asyncio.sleep(0.5)
    with tempfile.TemporaryDirectory(prefix="kr-survival-ui-") as config_dir:
        config_path = Path(config_dir)
        shutil.copytree(ROOT / "custom_components" / DOMAIN,
                        config_path / "custom_components" / DOMAIN,
                        ignore=shutil.ignore_patterns("__pycache__"))
        www = config_path / "www"
        www.mkdir()
        shutil.copy2(ROOT / "custom_components" / DOMAIN / "www" / "kr-survival-kit-card.js", www)
        shutil.copy2(ROOT / "output" / "pdf" / "kr-survival-kit-a4.pdf", www)
        shutil.copy2(ROOT / "output" / "offline.html", www / "kr-survival-kit-offline.html")
        shutil.copy2(ROOT / "output" / "dashboard.yaml", config_path)
        config = """homeassistant:
  auth_providers:
    - type: trusted_networks
      trusted_networks:
        - 127.0.0.1
        - ::1
      allow_bypass_login: true
    - type: homeassistant
http:
  server_port: 8129
  server_host: 127.0.0.1
frontend: {}
lovelace:
  resource_mode: yaml
  resources:
    - url: /local/kr-survival-kit-card.js
      type: module
  dashboards:
    kr-survival-kit:
      mode: yaml
      filename: dashboard.yaml
      title: KR Survival Kit
      icon: mdi:clipboard-check-outline
      show_in_sidebar: true
"""
        (config_path / "configuration.yaml").write_text(config, encoding="utf-8")
        hass = HomeAssistant(config_dir)
        loader.async_setup(hass)
        import custom_components
        custom_components.__path__.append(str(config_path / "custom_components"))
        assert await bootstrap.async_from_config_dict(yaml.safe_load(config), hass)
        await hass.async_start()
        if args.broker_down:
            assert await async_setup_component(hass, "mqtt", {})
            mqtt_flow = await hass.config_entries.flow.async_init("mqtt", context={"source": "user"})
            mqtt_flow = await hass.config_entries.flow.async_configure(
                mqtt_flow["flow_id"],
                {"broker": "127.0.0.1", "port": 18887,
                 "other_settings": {"set_client_cert": False, "set_ca_cert": "off"}},
            )
            assert mqtt_flow["type"] == "create_entry", mqtt_flow
        assert await async_setup_component(hass, "frontend", {})
        assert await async_setup_component(hass, "lovelace", {})
        assert await async_setup_component(hass, DOMAIN, {})
        admin = await hass.auth.async_create_user("P4 Test Admin", group_ids=["system-admin"])
        hass.data["onboarding"].onboarded = True
        flow = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": "user"}, data={"inspection_days": 30}
        )
        assert flow["type"] == "create_entry", flow
        await hass.async_block_till_done()
        if args.broker_down:
            entry = flow["result"]
            options = await hass.config_entries.options.async_init(entry.entry_id)
            options = await hass.config_entries.options.async_configure(
                options["flow_id"], {"mqtt_enabled": True}
            )
            assert options["type"] == "create_entry", options
            await hass.async_block_till_done()
            broker.terminate()
            broker.wait(timeout=10)
        print(f"UI_READY http://127.0.0.1:8129/kr-survival-kit/home {admin.id} {hass.config.components}", flush=True)
        try:
            while True:
                await asyncio.sleep(1)
        finally:
            await hass.async_stop()
            if broker is not None and broker.poll() is None:
                broker.terminate()
                broker.wait(timeout=10)


if __name__ == "__main__":
    asyncio.run(main())
