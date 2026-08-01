#!/usr/bin/env python3
"""
Find prompt files whose filename-encoded schedule matches a given day.

The `prompts/` directory uses the **filename as the schedule**. Each stem is a
date pattern, where each component is either a literal or a wildcard placeholder,
with an optional trailing weekday constraint:

    <year>-<month>[-<day>][-<dow>].md

  - year:  `yyyy` (any year)   or a literal 4-digit year (`2026`)
  - month: `mm`   (any month)  or a literal 2-digit month (`07`)
  - day:   `dd`   (any day)    or a literal 2-digit day   (`26`); may be omitted
  - dow:   optional weekday name `mon`..`sun` constraining to that weekday

Examples actually used in this repo:

    yyyy-mm-dd.md        -> every day            (the daily digest runner)
    yyyy-mm-dd-sun.md    -> every Sunday         (the weekly runner)
    yyyy-mm-01.md        -> the 1st of a month   (the monthly runner)
    yyyy-07.md           -> any day in July      (seasonal content, left in place)
    2026-12-26.md        -> once, on 2026-12-26  (one-time content, deleted after)

This script replaces the old "exact <YYYY-MM-DD>.md only" matcher so the digest
task doesn't have to re-derive any of this by hand. Stdlib-only (no pip install)
so it runs in any sandbox.

Role classification (structural, from the pattern alone):

    one-time  fully-literal calendar date, no weekday   -> run once, then delete
    daily     year+month+day all wildcard, no weekday
    weekly    any pattern carrying a weekday suffix
    monthly   literal day, wildcard month               (fires on a day-of-month)
    seasonal  literal month, wildcard/absent day        (fires within a month)
    annual    wildcard year, literal month AND day       (fires once a year)
    recurring anything else with a wildcard

`recurring` is simply `role != "one-time"`: only fully-literal one-time dates are
ever deleted by the caller; every pattern file is left in place.

Matching semantics:
  - one-time dates match if the date is today OR earlier (catch-up: a run that was
    skipped still picks the file up on the next run, however many days late).
  - every recurring pattern matches only when *today* fits its fixed components
    exactly — there is no catch-up for a recurring day that was missed; it simply
    fires on its next matching day.

Files whose leading token is not a year (`yyyy` or 4 digits) are ignored, so a
dispatcher file like `_dispatch.md`, a `README`, etc. never match. Patterns whose
literal components don't form a real value (month 13, day 40, or an impossible
one-time date like 2026-02-30) are skipped, not treated as matches.

Output is a JSON array on stdout, sorted deterministically (one-time dates oldest
first, then recurring patterns by filename), each entry carrying `path`,
`pattern`, `role`, `recurring`, and — with --contents — the file's full text.

Examples:
    python3 scripts/find_dated_prompts.py                 # matches for today
    python3 scripts/find_dated_prompts.py --contents       # include file bodies
    python3 scripts/find_dated_prompts.py --today 2026-07-15
    python3 scripts/find_dated_prompts.py --role seasonal  # filter to one role
"""

import argparse
import json
import sys
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PROMPTS_DIR = REPO_ROOT / "prompts"

WILDCARD = {"year": "yyyy", "month": "mm", "day": "dd"}
WEEKDAYS = {  # name -> Python weekday() index (Mon=0 .. Sun=6)
    "mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6,
}
# A far-future sentinel so recurring patterns sort after past one-time dates.
_SENTINEL = date(9999, 12, 31)


class Pattern:
    """A parsed filename schedule. Fields are None when wildcard/absent."""

    def __init__(self, stem: str):
        self.stem = stem
        self.year: int | None = None
        self.month: int | None = None
        self.day: int | None = None
        self.dow: int | None = None
        self.has_day_token = False  # distinguishes wildcard `dd` from an absent day
        self.valid = self._parse(stem)

    def _parse(self, stem: str) -> bool:
        tokens = stem.split("-")

        # Optional trailing weekday constraint.
        if tokens and tokens[-1].lower() in WEEKDAYS:
            self.dow = WEEKDAYS[tokens[-1].lower()]
            tokens = tokens[:-1]

        if not (1 <= len(tokens) <= 3):
            return False

        # Year is mandatory and must lead — this is what keeps non-schedule files
        # (_dispatch.md, README, etc.) out.
        year_tok = tokens[0].lower()
        if year_tok == WILDCARD["year"]:
            self.year = None
        elif year_tok.isdigit() and len(year_tok) == 4:
            self.year = int(year_tok)
        else:
            return False

        if len(tokens) >= 2:
            mon_tok = tokens[1].lower()
            if mon_tok == WILDCARD["month"]:
                self.month = None
            elif mon_tok.isdigit() and len(mon_tok) == 2 and 1 <= int(mon_tok) <= 12:
                self.month = int(mon_tok)
            else:
                return False

        if len(tokens) == 3:
            self.has_day_token = True
            day_tok = tokens[2].lower()
            if day_tok == WILDCARD["day"]:
                self.day = None
            elif day_tok.isdigit() and len(day_tok) == 2 and 1 <= int(day_tok) <= 31:
                self.day = int(day_tok)
            else:
                return False

        # A fully-literal calendar date must be a real date.
        if self.year is not None and self.month is not None and self.day is not None:
            try:
                date(self.year, self.month, self.day)
            except ValueError:
                return False

        return True

    @property
    def is_literal_date(self) -> bool:
        return (
            self.dow is None
            and self.year is not None
            and self.month is not None
            and self.day is not None
        )

    @property
    def role(self) -> str:
        if self.dow is not None:
            return "weekly"
        if self.is_literal_date:
            return "one-time"
        # No weekday, not fully literal -> some recurring shape.
        if self.year is None and self.month is None and self.day is None:
            return "daily"
        if self.month is None and self.day is not None:
            return "monthly"
        if self.month is not None and self.day is None:
            return "seasonal"
        if self.year is None and self.month is not None and self.day is not None:
            return "annual"
        return "recurring"

    @property
    def recurring(self) -> bool:
        return self.role != "one-time"

    def matches(self, today: date) -> bool:
        if not self.valid:
            return False
        if self.dow is not None and today.weekday() != self.dow:
            return False
        # One-time literal dates get catch-up (today or earlier); everything
        # recurring must fit today's components exactly.
        if self.is_literal_date:
            return date(self.year, self.month, self.day) <= today
        if self.year is not None and today.year != self.year:
            return False
        if self.month is not None and today.month != self.month:
            return False
        if self.day is not None and today.day != self.day:
            return False
        return True

    def sort_date(self) -> date:
        """Effective date for ordering: literal dates sort by themselves so the
        oldest pending one-time task runs first; recurring patterns sort last."""
        if self.is_literal_date:
            return date(self.year, self.month, self.day)
        return _SENTINEL


def find_matches(today: date, prompts_dir: Path = PROMPTS_DIR) -> list[Pattern]:
    matches = []
    for path in sorted(prompts_dir.iterdir()):
        if not path.is_file() or path.suffix != ".md":
            continue
        pat = Pattern(path.stem)
        if not pat.valid or not pat.matches(today):
            continue
        pat.path = path  # attach for the caller
        matches.append(pat)
    matches.sort(key=lambda p: (p.sort_date(), p.stem))
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
    parser.add_argument(
        "--role",
        metavar="ROLE",
        help="Only return matches with this role (e.g. seasonal, one-time, daily).",
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

    result = []
    for pat in find_matches(today, PROMPTS_DIR):
        if args.role and pat.role != args.role:
            continue
        entry = {
            "path": str(pat.path.relative_to(REPO_ROOT)),
            "pattern": pat.stem,
            "role": pat.role,
            "recurring": pat.recurring,
        }
        if args.contents:
            entry["contents"] = pat.path.read_text()
        result.append(entry)

    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
