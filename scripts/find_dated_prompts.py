#!/usr/bin/env python3
"""
Find current-or-expired one-time dated prompt files.

Implements the "Check for one-time task files" logic from prompts/daily.md so the
scheduled digest task doesn't have to re-derive the date matching by hand each
run. Stdlib-only (no pip install) so it runs in any sandbox.

A one-time prompt is a file named exactly prompts/<YYYY-MM-DD>.md (plain numeric
ISO date, e.g. prompts/2026-07-23.md). Unlike the recurring daily.md / weekly.md
/ monthly.md, these are ad hoc instructions written for a specific date and are
meant to run once and then be deleted.

Matching rule (from daily.md):
  - A file matches if its date is today OR any earlier date, so a run that was
    skipped (task disabled, error, etc.) still picks the file up on the next run
    however many days late.
  - Files dated in the future are ignored until their day arrives.
  - Multiple files can match at once; they are returned oldest date first.

Output is JSON on stdout so the caller can fold each file into the digest's
one-time-tasks section in order. Files that look like dates but aren't valid
calendar dates (e.g. 2026-13-40.md) are skipped, not treated as matches.

Examples:
    # List matches for today (paths + dates only)
    python3 scripts/find_dated_prompts.py

    # Include each file's full contents in the JSON
    python3 scripts/find_dated_prompts.py --contents

    # Test against a fixed date instead of today
    python3 scripts/find_dated_prompts.py --today 2026-07-25
"""

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PROMPTS_DIR = REPO_ROOT / "prompts"

# Exactly <YYYY-MM-DD>.md — the same plain ISO date format used everywhere else
# in this repo (digest.md's date: field, etc.). Anchored so daily.md / weekly.md
# / monthly.md and anything else never match.
DATE_FILE_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})\.md$")


def parse_date_filename(name: str) -> date | None:
    """Return the date encoded in a <YYYY-MM-DD>.md filename, or None.

    None means either the name isn't in the date format at all or the digits
    don't form a real calendar date (e.g. 2026-13-40.md).
    """
    m = DATE_FILE_RE.match(name)
    if not m:
        return None
    try:
        return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    except ValueError:
        return None


def find_dated_prompts(today: date, prompts_dir: Path = PROMPTS_DIR) -> list[dict]:
    """Dated prompt files with date <= today, oldest first."""
    matches = []
    for path in prompts_dir.iterdir():
        if not path.is_file():
            continue
        file_date = parse_date_filename(path.name)
        if file_date is None or file_date > today:
            continue
        matches.append({"date": file_date, "path": path})
    matches.sort(key=lambda m: m["date"])
    return matches


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument(
        "--today",
        metavar="YYYY-MM-DD",
        help="Reference date to compare against (default: today's local date).",
    )
    parser.add_argument(
        "--contents",
        action="store_true",
        help="Include each matched file's full text in the JSON output.",
    )
    args = parser.parse_args()

    if args.today:
        try:
            today = date.fromisoformat(args.today)
        except ValueError:
            print(f"Invalid --today date: {args.today!r}", file=sys.stderr)
            return 2
    else:
        today = date.today()

    if not PROMPTS_DIR.is_dir():
        print(f"Prompts directory not found: {PROMPTS_DIR}", file=sys.stderr)
        return 1

    matches = find_dated_prompts(today, PROMPTS_DIR)

    result = []
    for m in matches:
        entry = {
            "date": m["date"].isoformat(),
            "path": str(m["path"].relative_to(REPO_ROOT)),
        }
        if args.contents:
            entry["contents"] = m["path"].read_text()
        result.append(entry)

    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
