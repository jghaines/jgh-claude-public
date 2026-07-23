# Weekly Digest

Produce a week-in-review payload — a broader, less time-sensitive complement to the daily digest. Where the daily digest favors yesterday's items, this looks back across the past 7 days and surfaces the handful of stories/developments that mattered most, with a bit more synthesis than a daily item gets.

**Content to cover (adjust based on what's actually noteworthy that week — skip anything thin):**

1. **Steam machine availability**: 


**Output format:**
Do NOT generate a standalone HTML file or upload anything to S3 — this task only produces a payload that the daily-morning-digest task will pick up and fold into a future digest.

Write the findings as a single Markdown file with this structure:
```
## Weekly Digest — <today's date>

### Steam Machine Availability
- finding 1 (with source link)
- finding 2 ...
(omit this subsection entirely if nothing noteworthy)
```

If there is nothing noteworthy in this period, delete the payload file.

**Publish the payload via git:**
In the repo directory (already pulled by the bootstrap step):
```
mkdir -p payloads
# write the markdown content above to payloads/b8-mcp-pending.md, OVERWRITING any existing file
git add payloads/weekly.md
git commit -m "weekly payload $(date +%Y-%m-%d)"
git push origin HEAD:main
```

Note: `payloads/weekly-pending.md` is a queue of exactly one pending item — this task always overwrites it. The daily-morning-digest task is responsible for consuming (reading, folding into a digest, then deleting) this file, so if it's still present when this task runs again next week, it means the daily task hasn't picked it up yet; overwriting with the newest findings is still the correct behavior.

**Run summary must state:** which topics had noteworthy findings, if any.


**Output schema — write to `./payloads/weekly-digest.md` at the repo root** (same schema style as `digest.md`, so the same front-end renderer can handle both):
```
