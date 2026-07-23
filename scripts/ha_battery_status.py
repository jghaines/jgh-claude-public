#!/usr/bin/env python3
"""
Home Assistant battery sensor checker.

Stdlib-only by design (urllib, json) so it runs in any sandbox without a pip
install step - matches the convention in scripts/steam_machine_check.py.

Intended to be invoked directly by the daily-morning-digest scheduled task
(see prompts/daily.md), which folds the markdown output into that day's
digest.md. Unlike steam_machine_check.py, this does NOT go through the
payloads/ queue - battery levels are a daily-fresh thing, not a monthly one,
so there's no need to stage it for a later task to pick up.

Connectivity note: Home Assistant (http://homeassistant.local:8123) is only
reachable on the home LAN today. The scheduled task runs in Anthropic's cloud
sandbox, which is NOT on that network, so this will fail with an unreachable
error every day until Tailscale (or equivalent) is set up to expose HA
outside the LAN - that's a known TODO, not a bug. Treat a connection failure
here as "ha_status: unreachable" and move on; do not treat it as a task
failure.

Auth: reads the HA long-lived access token from the HOME_ASSISTANT_TOKEN
env var. Never hardcode it here or commit it - same handling as the GitHub
PAT described in AGENTS.md (lives only in the scheduled task's environment).

Usage:
    python3 ha_battery_status.py                 # JSON to stdout
    python3 ha_battery_status.py --markdown       # ready-to-paste digest section body
    python3 ha_battery_status.py --url http://homeassistant.local:8123 --threshold 20
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

DEFAULT_URL = "http://homeassistant.local:8123"
DEFAULT_THRESHOLD = 20
TIMEOUT = 8


def fetch_states(base_url: str, token: str) -> list[dict]:
    req = urllib.request.Request(
        f"{base_url.rstrip('/')}/api/states",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_battery_sensors(states: list[dict]) -> list[dict]:
    """Pull out anything that looks like a battery-level sensor."""
    sensors = []

    for entity in states:
        entity_id = entity.get("entity_id", "")
        attrs = entity.get("attributes", {})
        device_class = (attrs.get("device_class") or "").lower()
        unit = attrs.get("unit_of_measurement") or ""
        state = entity.get("state")

        looks_like_battery = device_class == "battery" or "battery" in entity_id.lower()
        if not looks_like_battery:
            continue

        try:
            percentage = int(float(state))
        except (TypeError, ValueError):
            continue  # e.g. state is "unavailable" or "unknown"

        sensors.append(
            {
                "entity_id": entity_id,
                "name": attrs.get("friendly_name", entity_id),
                "percentage": max(0, min(100, percentage)),
                "unit": unit or "%",
            }
        )

    sensors.sort(key=lambda s: s["percentage"])
    return sensors


def get_battery_status(base_url: str, token: str) -> dict:
    """Returns a result dict with status: ok | empty | unreachable."""
    try:
        states = fetch_states(base_url, token)
    except urllib.error.HTTPError as e:
        return {"status": "unreachable", "error": f"HTTP {e.code}: {e.reason}", "sensors": []}
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return {"status": "unreachable", "error": str(e), "sensors": []}

    sensors = extract_battery_sensors(states)
    if not sensors:
        return {"status": "empty", "error": None, "sensors": []}

    return {"status": "ok", "error": None, "sensors": sensors}


def to_markdown(result: dict, threshold: int) -> str:
    """Render as a digest section body ready to paste under '## Battery Status'."""
    date_str = datetime.now().strftime("%B %-d")

    if result["status"] == "unreachable":
        return (
            f"### Battery Levels\n"
            f"*{date_str}*\n\n"
            f"Home Assistant wasn't reachable this morning ({result['error']}). "
            f"Skipping battery status until connectivity is fixed.\n"
        )

    if result["status"] == "empty":
        return (
            f"### Battery Levels\n"
            f"*{date_str}*\n\n"
            f"No battery sensors found in Home Assistant.\n"
        )

    lines = []
    for s in result["sensors"]:
        flag = " ⚠️ low" if s["percentage"] < threshold else ""
        lines.append(f"- {s['name']}: {s['percentage']}%{flag}")

    return f"### Battery Levels\n*{date_str}*\n\n" + "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=os.environ.get("HOME_ASSISTANT_URL", DEFAULT_URL))
    parser.add_argument("--token", default=os.environ.get("HOME_ASSISTANT_TOKEN"))
    parser.add_argument("--threshold", type=int, default=DEFAULT_THRESHOLD)
    parser.add_argument("--markdown", action="store_true", help="print digest-ready markdown instead of JSON")
    args = parser.parse_args()

    if not args.token:
        result = {"status": "unreachable", "error": "HOME_ASSISTANT_TOKEN not set", "sensors": []}
    else:
        result = get_battery_status(args.url, args.token)

    result["checked_at"] = datetime.now(timezone.utc).isoformat()
    result["low_threshold"] = args.threshold
    result["any_low"] = any(s["percentage"] < args.threshold for s in result["sensors"])

    if args.markdown:
        print(to_markdown(result, args.threshold))
    else:
        print(json.dumps(result, indent=2))

    return 0 if result["status"] != "unreachable" else 1


if __name__ == "__main__":
    sys.exit(main())
