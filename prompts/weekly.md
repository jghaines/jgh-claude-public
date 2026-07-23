# Weekly Digest

Weekly task, currently scoped to one thing: check Steam Machine (AU store) availability and price, and publish it as a payload for the daily digest to pick up.

**Steam Machine availability check:**
Run the checker script rather than fetching/parsing the page yourself — it's a deterministic scrape (price + availability only), so a script is faster and cheaper than doing it via web search/fetch each week:
```
python3 scripts/steam_machine_check.py
```
This is stdlib-only (no `pip install` needed) and:
- Fetches https://store.steampowered.com/hardware/steammachine with a conditional GET against a locally cached ETag, so an unchanged page costs a 304, not a full re-fetch.
- Parses availability and A$ price with targeted regexes (no DOM library needed for two fields).
- Writes `payloads/weekly-pending.md` with the current status and a note on whether anything changed since last week.
- Caches state in `scripts/.steam_cache.json` (gitignored — local state, not repo content).
- Prints a one-line summary (availability, price, changed y/n) to stdout for the run log.

If it exits non-zero (network/parse failure), that's non-fatal — note it in the run summary below and move on. Do not attempt to fetch/parse the page yourself as a fallback; if the script fails, the payload will say so and next week's run will retry.

**Publish the payload via git:**
In the repo directory (already pulled by the bootstrap step):
```
git add payloads/weekly-pending.md
git commit -m "Weekly Steam Machine check $(date +%Y-%m-%d)"
git push origin HEAD:main
```

Note: `payloads/weekly-pending.md` is a queue of exactly one pending item — this task always overwrites it (the script does this automatically). This matches the `payloads/*-pending.md` convention that `daily-morning-digest` already globs for: it's responsible for consuming (reading, folding into `digest.md`, then deleting) this file. If it's still present when this task runs again next week, that means the daily task hasn't picked it up yet — overwriting with the newest status is still correct behavior.

**Run summary must state:** availability, price, and whether either changed since last week (or that the check failed, if it did).
