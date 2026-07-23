#!/usr/bin/env python3
"""
Steam Machine (AU store) availability/price checker.

Stdlib-only by design (urllib, re, json) so it runs in any sandbox without
a pip install step. Intended to be invoked by the weekly-digest-recap
scheduled task (see prompts/weekly.md), which then commits whatever this
script writes to payloads/steam-machine-pending.md.

Efficiency notes:
- Uses a conditional GET (If-None-Match) against a locally cached ETag so an
  unchanged page costs a 304 response, not a full body transfer.
- Falls back to content-hash comparison if the server doesn't return an ETag.
- Parses with targeted regexes instead of a full HTML/DOM parser - there's
  no need to build a DOM just to pull two fields off the page.
- Cache lives outside git (scripts/.steam_cache.json, gitignored) so it
  persists across runs in the persistent working folder without polluting
  commit history.
"""

import hashlib
import json
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

STEAM_URL = "https://store.steampowered.com/hardware/steammachine"
TIMEOUT = 10

REPO_ROOT = Path(__file__).resolve().parent.parent
CACHE_FILE = REPO_ROOT / "scripts" / ".steam_cache.json"
# Matches the repo's payloads/<task>-pending.md convention (see prompts/daily.md,
# which globs payloads/*-pending.md) - this is the weekly task's payload.
PAYLOAD_FILE = REPO_ROOT / "payloads" / "weekly-pending.md"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    # cc=AU + Steam's currency cookie nudge the store to return AUD pricing
    # regardless of where the request originates from.
    "Cookie": "birthtime=0; wants_mature_content=1; steamCountry=AU%7C0",
}


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


def fetch_page(cache: dict) -> tuple[str | None, bool, str | None]:
    """
    Returns (html, was_cached, etag).
    html is None only on total failure with no usable cache fallback.
    """
    req = urllib.request.Request(STEAM_URL, headers=dict(HEADERS))
    if cache.get("etag"):
        req.add_header("If-None-Match", cache["etag"])

    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            html = resp.read().decode("utf-8", errors="replace")
            etag = resp.headers.get("ETag")
            return html, False, etag
    except urllib.error.HTTPError as e:
        if e.code == 304:
            return cache.get("html"), True, cache.get("etag")
        print(f"HTTP error fetching Steam page: {e}", file=sys.stderr)
        return cache.get("html"), True, cache.get("etag")
    except urllib.error.URLError as e:
        print(f"Network error fetching Steam page: {e}", file=sys.stderr)
        return cache.get("html"), True, cache.get("etag")


def parse_availability(html: str) -> tuple[bool | None, str | None]:
    """Selective regex parse - no DOM library needed for two fields."""
    add_to_cart = re.search(
        r'"purchase".*?type["\']?\s*:\s*["\']?addtocart', html, re.IGNORECASE | re.DOTALL
    )
    notify_me = re.search(r'notify.me|out.of.stock|coming.soon', html, re.IGNORECASE)
    available = bool(add_to_cart) and not bool(notify_me) if add_to_cart or notify_me else None

    price_match = re.search(r'A\$\s*([\d,]+(?:\.\d{2})?)', html)
    price = price_match.group(1).replace(",", "") if price_match else None

    return available, price


def write_payload(status: dict, changed: bool) -> None:
    PAYLOAD_FILE.parent.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")

    if status["available"] is None:
        body = (
            f"## Steam Machine Availability — {date_str}\n\n"
            f"_Could not determine availability this week (parse or fetch issue). "
            f"Last known: {status.get('previous_summary', 'no prior data')}._\n"
        )
    else:
        avail_text = "In stock" if status["available"] else "Out of stock / notify-me only"
        price_text = f"A${status['price']}" if status["price"] else "not found on page"
        change_text = status["change_note"] if changed else "No change since last check."

        body = (
            f"## Steam Machine Availability — {date_str}\n\n"
            f"**Store:** Steam (AU)\n"
            f"**Availability:** {avail_text}\n"
            f"**Price:** {price_text}\n"
            f"**Change since last check:** {change_text}\n\n"
            f"[View on Steam]({STEAM_URL})\n"
        )

    PAYLOAD_FILE.write_text(body)


def main() -> int:
    cache = load_cache()
    html, was_cached, etag = fetch_page(cache)

    if html is None:
        print("No page content available (fetch failed, no cache fallback).")
        write_payload({"available": None, "price": None}, changed=False)
        return 1

    content_hash = hashlib.md5(html.encode()).hexdigest()
    prev_hash = cache.get("content_hash")
    prev_available = cache.get("available")
    prev_price = cache.get("price")

    # If it's the cached page verbatim (304 or identical hash), skip re-parsing.
    if was_cached and prev_hash and content_hash == prev_hash:
        available, price = prev_available, prev_price
        changed = False
    else:
        available, price = parse_availability(html)
        changed = (available != prev_available) or (price != prev_price)

    change_note = "No prior data to compare."
    if prev_hash is not None:
        if available != prev_available and available is not None:
            change_note = (
                f"Became {'available' if available else 'unavailable'} "
                f"(was {'available' if prev_available else 'unavailable'})."
            )
        elif price != prev_price and price and prev_price:
            change_note = f"Price changed from A${prev_price} to A${price}."
        elif changed:
            change_note = "Status changed."

    status = {
        "available": available,
        "price": price,
        "change_note": change_note,
        "previous_summary": (
            f"{'available' if prev_available else 'unavailable'}, A${prev_price}"
            if prev_hash else None
        ),
    }
    write_payload(status, changed=changed)

    save_cache(
        {
            "content_hash": content_hash,
            "etag": etag,
            "html": html,
            "available": available,
            "price": price,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    print(f"Availability: {available} | Price: A${price} | Changed: {changed}")
    print(f"Payload written to {PAYLOAD_FILE.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
