#!/usr/bin/env python3
"""
Steam Machine (AU store) availability/price checker.

Stdlib-only by design (urllib, json) so it runs in any sandbox without a pip
install step. Intended to be invoked by the weekly-digest-recap scheduled task
(see prompts/weekly.md), which then commits whatever this script writes to
payloads/weekly-pending.md.

Data source: this reads Steam's store API directly rather than scraping
https://store.steampowered.com/hardware/steammachine. The HTML served for that
page contains no prices and no purchase state at all - both are rendered
client-side from the two API calls below, so a regex over the served HTML can
only ever match unrelated numbers (it used to pick up "Under A$ 5.00" from the
store's price-filter dropdown and report that as the console's price).

- IStoreBrowseService/GetItems enumerates the SKUs from the single Steam Machine
  appid, so the four package IDs are discovered rather than hardcoded and a new
  SKU shows up on its own.
- IStoreBrowseService/GetHardwareItems returns the stock/waitlist state per
  package, which is the field the page's own buy box is driven by.

Both return small JSON documents, so the local cache (scripts/.steam_cache.json,
gitignored) exists only for week-over-week change detection, not to save
bandwidth. Change detection is deliberately availability-only: prices are
reported for context but a price move is not treated as news.
"""

import json
import sys
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# The Steam Machine store app. Its purchase_options are the individual SKUs
# (512GB / 2TB, each with or without a controller).
STEAM_APPID = 4165910
STEAM_URL = "https://store.steampowered.com/hardware/steammachine"
COUNTRY = "AU"
TIMEOUT = 15

GET_ITEMS_URL = "https://api.steampowered.com/IStoreBrowseService/GetItems/v1/"
GET_HARDWARE_URL = "https://api.steampowered.com/IStoreBrowseService/GetHardwareItems/v1/"

REPO_ROOT = Path(__file__).resolve().parent.parent
CACHE_FILE = REPO_ROOT / "scripts" / ".steam_cache.json"
# Matches the repo's payloads/<task>-pending.md convention (see prompts/daily.md,
# which globs payloads/*-pending.md) - this is the weekly task's payload.
PAYLOAD_FILE = REPO_ROOT / "payloads" / "weekly-pending.md"

CONTEXT = {"language": "english", "country_code": COUNTRY}


def load_cache() -> dict:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def save_cache(data: dict) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(data, indent=2))


def api_get(url: str, payload: dict) -> dict:
    """GET a Steam store API method with its input_json argument."""
    query = urllib.parse.urlencode({"input_json": json.dumps(payload)})
    req = urllib.request.Request(f"{url}?{query}", headers={"User-Agent": "jgh-claude-weekly-check"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_skus() -> list[dict]:
    """One appid in, every purchasable SKU out (id, name, formatted price)."""
    data = api_get(
        GET_ITEMS_URL,
        {
            "ids": [{"appid": STEAM_APPID}],
            "context": CONTEXT,
            "data_request": {"include_basic_info": True, "include_all_purchase_options": True},
        },
    )
    items = data.get("response", {}).get("store_items", [])
    if not items:
        raise ValueError("GetItems returned no store_items")

    skus = []
    for option in items[0].get("purchase_options", []):
        skus.append(
            {
                "packageid": option["packageid"],
                "name": option.get("purchase_option_name", "Unknown model"),
                "price": option.get("formatted_final_price"),
            }
        )
    if not skus:
        raise ValueError("GetItems returned no purchase_options")
    return skus


def fetch_availability(package_ids: list[int]) -> dict[int, dict]:
    data = api_get(
        GET_HARDWARE_URL, {"packageid": package_ids, "context": CONTEXT}
    )
    return {d["packageid"]: d for d in data.get("response", {}).get("details", [])}


def sku_status(detail: dict | None) -> tuple[bool | None, str]:
    """
    Map the hardware detail block to (available, human status).

    Fields that describe the *requesting account* (account_restricted_from_purchasing,
    reservation_state, the *_token fields) are ignored - these calls are anonymous,
    so those say nothing about the store.
    """
    if detail is None:
        return None, "Unknown"

    if not detail.get("allow_purchase_in_country", True):
        return False, "Not sold in this country"

    waitlist = (
        detail.get("requires_reservation")
        or detail.get("queue_in_waitlist")
        or detail.get("position_is_waitlist")
    )
    if waitlist:
        return False, "Waitlist only"
    if not detail.get("inventory_available"):
        return False, "Out of stock"
    return True, "In stock"


def write_payload(skus: list[dict] | None, change_note: str, previous_summary: str | None) -> None:
    PAYLOAD_FILE.parent.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")

    if not skus:
        body = (
            f"## Steam Machine Availability — {date_str}\n\n"
            f"_Could not determine availability this week (API or network issue). "
            f"Last known: {previous_summary or 'no prior data'}._\n"
        )
        PAYLOAD_FILE.write_text(body)
        return

    if any(s["available"] for s in skus):
        headline = "In stock — at least one model is purchasable now"
    elif all(s["available"] is False for s in skus):
        headline = "Not purchasable — " + ", ".join(sorted({s["status"] for s in skus})).lower()
    else:
        headline = "Mixed / partly unknown"

    rows = "\n".join(
        f"| {s['name']} | {s['price'] or '—'} | {s['status']} |" for s in skus
    )

    body = (
        f"## Steam Machine Availability — {date_str}\n\n"
        f"**Store:** Steam ({COUNTRY})\n"
        f"**Availability:** {headline}\n"
        f"**Change since last check:** {change_note}\n\n"
        f"| Model | Price | Status |\n"
        f"| --- | --- | --- |\n"
        f"{rows}\n\n"
        f"[View on Steam]({STEAM_URL})\n"
    )
    PAYLOAD_FILE.write_text(body)


def describe_change(skus: list[dict], previous: dict) -> str:
    """Availability-only change detection - price moves are not news."""
    if not previous:
        return "No prior data to compare."

    changes = []
    for sku in skus:
        was = previous.get(str(sku["packageid"]), {}).get("status")
        if was is not None and was != sku["status"]:
            changes.append(f"{sku['name']}: {was} → {sku['status']}")

    new_skus = [s["name"] for s in skus if str(s["packageid"]) not in previous]
    if new_skus:
        changes.append("New model listed: " + ", ".join(new_skus))

    return "; ".join(changes) if changes else "No availability change since last check."


def main() -> int:
    cache = load_cache()
    previous = cache.get("skus", {})
    previous_summary = cache.get("summary")

    try:
        skus = fetch_skus()
        details = fetch_availability([s["packageid"] for s in skus])
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, KeyError, json.JSONDecodeError) as e:
        print(f"Failed to fetch Steam Machine status: {e}", file=sys.stderr)
        write_payload(None, "", previous_summary)
        print(f"Payload written to {PAYLOAD_FILE.relative_to(REPO_ROOT)}")
        return 1

    for sku in skus:
        sku["available"], sku["status"] = sku_status(details.get(sku["packageid"]))

    change_note = describe_change(skus, previous)
    changed = change_note not in ("No availability change since last check.", "No prior data to compare.")
    summary = "; ".join(f"{s['name']} {s['status']} at {s['price']}" for s in skus)

    write_payload(skus, change_note, previous_summary)
    save_cache(
        {
            "skus": {
                str(s["packageid"]): {"name": s["name"], "price": s["price"], "status": s["status"]}
                for s in skus
            },
            "summary": summary,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    for sku in skus:
        print(f"  {sku['name']}: {sku['status']} | {sku['price']}")
    print(f"Availability changed since last check: {changed}")
    print(f"Payload written to {PAYLOAD_FILE.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
