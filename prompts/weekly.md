# Weekly Digest Recap

Produce a week-in-review payload — a broader, less time-sensitive complement to the daily digest. Where the daily digest favors yesterday's items, this looks back across the past 7 days and surfaces the handful of stories/developments that mattered most, with a bit more synthesis than a daily item gets.

**Content to cover (adjust based on what's actually noteworthy that week — skip anything thin):**
1. **AI News recap**: The 2-4 biggest AI developments of the week (model releases, safety incidents, policy shifts, major funding). Search the web for the past 7 days rather than relying only on inbox newsletters, since this should synthesize across sources, not just repeat daily items verbatim.
2. **Apple recap**: Any Apple news of note from the week (product, earnings, market moves).
3. **Anything else noteworthy**: Use judgment — if there's a clear theme or throughline across the week worth calling out (e.g. "three separate AI safety incidents this week"), note it as a short synthesis rather than a bare list.

This is a newer, less-specified task than daily/monthly — use good judgment on scope and depth. Keep it tighter than a full report: aim for a handful of items with 2-4 sentences each, not exhaustive coverage.

**Output schema — write to `digest-weekly.md` at the repo root** (same schema style as `digest.md`, so the same front-end renderer can handle both):
```
---
date: <YYYY-MM-DD, the date this recap was generated>
week_of: <YYYY-MM-DD, the Monday starting the week being recapped>
generated_at: <ISO 8601 timestamp, local timezone offset>
sections:
  - id: ai-news-week
    title: AI News This Week
    icon: "🧠"
  - id: apple-news-week
    title: Apple News This Week
    icon: "🍎"
---

## AI News This Week

### <Item/theme title>
*<date or date range>*

<2-4 sentence synthesis, with markdown links to sources where relevant.>
```

**Publish via git:**
In the repo directory (already pulled by the bootstrap step):
```
git add digest-weekly.md
git commit -m "Weekly digest recap $(date +%Y-%m-%d)"
git push origin HEAD:main
```
The payload will be reachable at: https://jghaines.github.io/jgh-claude-public/digest-weekly.md — same caveats as digest.md: this fetch from inside the sandbox to verify github.io will fail, that's expected, don't treat it as a failure.

**Run summary must state:** which sections were included and a one-line gut-check on whether the week's content felt thin or substantial (this task's scope was defined by inference, not explicit user spec — flag if the format or depth seems off so it can be refined).

Also save the generated digest-weekly.md to the outputs folder for local reference.
