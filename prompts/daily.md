# Daily Morning Digest

Generate a morning digest payload for the user. This task produces ONLY a structured markdown+frontmatter data file (`digest.md`) at the repo root — it does NOT generate any HTML. The user maintains their own HTML/JS front-end separately that fetches and renders this payload (with its own theme handling, layout, etc.). Your job is strictly content: gather the data, write it in the schema below, and publish it.

**Data sources:**
1. **One-Time Task**: See "Check for one-time task files" step below — include as a priority section at the very top of the digest, only if any date-stamped one-time prompt files are found.

2. **Fastmail Summary**: Load the Fastmail MCP tools with ToolSearch (try query "fastmail", then "email inbox" if the first returns nothing). If tools load, use them to check the Inbox and Subscriptions folders for unread messages since yesterday, and set `fastmail_status: ok` (or `empty` if there were genuinely no unread messages).

   If no Fastmail tools load after those two attempts, OR a Fastmail tool call errors or hangs, set `fastmail_status: skipped` with a one-line `fastmail_note` saying what happened, and move on immediately. Do not retry, and do not attempt to reach Fastmail by any other route. The connector has been intermittently disconnected; a scheduled run has no human present to approve a permission prompt, so a hanging tool call will stall the entire run. Steps 3, 4, and 5 depend on this step — if it was skipped, omit those sections rather than inventing content.

3. **Centralian News**: Extract highlights from Fastmail inbox messages (requires step 2 to have worked), typically from *The Centralian Today* newsletter. Curate for **Ack's interests**: remote schooling, and music teaching / music programs in remote schools. Surface articles on those themes — e.g. a piece on the Remote Music Rangers program working with locals in remote NT communities is exactly the kind of thing to include. Other genuinely notable local news is fine too, but lead with those themes. Include a link to the source article for each item where the email provides one. Note on timing: this newsletter often arrives in the evening (~6:30pm ACST), which is after that day's digest has already run — so an evening edition is picked up by the *next* morning's digest. That lag is expected, not a miss.

4. **AI News**: Extract highlights from Fastmail inbox messages (requires step 2 to have worked)

5. **Apple News**: Extract Apple-related highlights from Fastmail inbox messages (requires step 2 to have worked). Do NOT search the web for Apple news — a previous web search returned garbage; rely solely on what's in the email. Only include important news. Skip Apple financials/earnings entirely unless something is genuinely earth-shattering.

6. **Home Assistant Battery Status**: Use the Home Assistant MCP connector directly (do NOT use `scripts/ha_battery_status.py` or `HOME_ASSISTANT_TOKEN`/Tailscale — that script is deprecated/legacy, kept only for local reference, no longer wired into this task). Call `mcp__Home_Assistant__GetLiveContext` with `name: "Battery Level"` to fetch the house battery sensor (confirmed working — e.g. returns `state: '60.4'`, `unit_of_measurement: '%'`). If the tool call succeeds and returns a sensor reading, set `ha_status: ok` and render a `### Battery Levels` item listing the sensor name and percentage (flag with ⚠️ low if under 20%). If the tool call errors or the connector isn't available, set `ha_status: unreachable` and note that in the body. If it returns successfully but with no matching sensor, set `ha_status: empty`. Always include the `battery` section (id `battery`, title `Battery Status`, icon `🔋`) regardless of status.

7. **Scheduled payload**: See step below — include only if a pending payload file exists.

Section inclusion rules:
- **The three news sections — Centralian News, AI News, Apple News — are always included whenever Fastmail succeeded (`fastmail_status: ok`)**, even on a slow day. If one has nothing noteworthy, still emit the section with a single line: *Nothing newsworthy today.* This is deliberate reassurance that the task ran and genuinely found nothing, rather than the section silently vanishing. (If `fastmail_status` is `skipped` or `empty`, omit all three — the status field already explains why there's no news.)
- **The `battery` section is always included** regardless of status — it reports its own state (including "unreachable") rather than being silently skipped, so a missing battery reading is visible in the digest instead of just disappearing.
- **All other sections** (one-time-tasks, monthly/weekly updates, scheduled payload) are included only when they have content; omit them entirely (from both the frontmatter `sections` list and the body) otherwise.

**Check for one-time task files (do this FIRST, before anything else — highest priority):**
These are ad hoc, one-time task instructions the user wrote for a specific date, one per file named `prompts/<yyyy-mm-dd>.md` (plain numeric ISO date, e.g. `prompts/2026-07-23.md`) — unlike `daily.md`/`weekly.md`/`monthly.md`, which are recurring and never deleted. The date-matching logic lives in a script so it doesn't have to be re-derived each run; from the repo directory run:
```
python3 scripts/find_dated_prompts.py --contents
```
It prints a JSON array of the matching files (each with `date`, `path`, and full `contents`), already filtered and sorted for you: it includes any file dated today or earlier — so a file is still picked up on the next run however many days late — ignores future-dated files, and returns them oldest date first. An empty array `[]` means no files match, which is the normal case for most days; skip this whole step when that happens. (Run without `--contents` if you only want the paths; pass `--today YYYY-MM-DD` only for testing.)

For each file in that JSON array, in the order given (oldest date first):
1. Take the file's `contents` from the JSON and execute/evaluate whatever it asks for — these are arbitrary, one-off instructions (a reminder, a lookup, a task to perform), not a fixed schema. Use judgment.
2. Fold the result into a section with id `one-time-tasks`, title `One-Time Task` (or a more specific title drawn from the file's own content if it has one), icon `⚡`. This section must be listed FIRST in the frontmatter `sections` list and appear FIRST in the body — ahead of Fastmail/AI News/Apple News/scheduled-payload sections. If multiple dated files matched, include each as its own `###` item within this single section, oldest first.
3. After folding its result into the digest, delete the file so it never runs again:
   ```
   git rm prompts/<the-matched-filename>.md
   ```
   Stage this alongside the digest.md commit below (or as its own commit) — either is fine, just make sure everything is pushed together in one `git push` at the end.

**Check for Scheduled payload (do this next, before generating the digest):**
Less frequent scheduled tasks write their findings to `payloads/*-pending.md` in this repo. From the repo directory (already pulled by the bootstrap step):
```
cat payloads/*-pending.md 2>/dev/null
```
If it exists and has noteworthy findings, fold its content into a section with the corresponding name (see schema below). Then remove it so it isn't shown again tomorrow:
```
git rm payloads/*-pending.md
git commit -m "Consume payloads/* $(date +%Y-%m-%d)"
```
(commit this alongside the digest.md push below, in the same git session, so only one push is needed.) If the file doesn't exist, or says there were no noteworthy findings, skip this section entirely — that's the normal case for most days.

**Output schema — write to `digest.md` at the repo root:**
```
---
date: <YYYY-MM-DD>
generated_at: <ISO 8601 timestamp, local timezone offset>
fastmail_status: ok | empty | skipped
fastmail_note: "<short explanation if empty or skipped, else empty string>"
ha_status: ok | empty | unreachable
sections:
  - id: one-time-tasks
    title: One-Time Task
    icon: "⚡"
  - id: centralian-news
    title: Centralian News
    icon: "📰"
  - id: ai-news
    title: AI News
    icon: "🧠"
  - id: apple-news
    title: Apple News
    icon: "🍎"
  - id: monthly-update
    title: Monthly Update
    icon: "🏢"
  - id: weekly-update
    title: Weekly Update
    icon: "🏢"
  - id: battery
    title: Battery Status
    icon: "🔋"
  (list sections in the order they appear in the body — one-time-tasks always goes first when present; the three news sections are always listed when `fastmail_status: ok`, even if a section's only content is a "Nothing newsworthy today." line; battery always goes last and is always listed, even when ha_status is empty or unreachable; every other section is listed only when it has content)
---

## One-Time Task

### <Item title, from the dated prompt file or a description of what it asked for>
*<the file's date, e.g. "2026-07-23">*

<result of executing that file's instructions>

## Centralian News

### <Item title>

<summary> [Read more](<article url>) [<hostname>]

## AI News

### <Item title>

<1-3 sentence summary.> [Read more](<article url>) [<hostname>]

### <Next item title>

<summary> [Read more](<article url>) [<hostname>]

## Apple News

*Nothing newsworthy today.*

## Battery Status

### Battery Levels
*<yyyy MMMM dd dow HH:mm, e.g. "2026 July 26 Sunday 05:45">*

<bullet list of device: percentage from the Home Assistant MCP call (e.g. "- Battery Level: 60%"), or an unreachable/empty status message if the MCP call failed or found no sensor>
```
Use `##` headers matching each section's `title` from frontmatter, and `###` per item within a section, then a short prose summary. Keep summaries tight — 1-3 sentences, no bullet lists needed.

**Per-item timestamps:** Do NOT put an italic timestamp line under news items (AI News, Apple News, etc.) — they were noise, so omit them. The ONLY item that keeps a timestamp is **Battery Levels**, whose italic line is the **time of retrieval** — the wall-clock time you actually made the Home Assistant MCP call and got the reading — formatted as `yyyy MMMM dd dow HH:mm` (e.g. `2026 July 26 Sunday 05:45`). Use local Alice Springs time (Australia/Darwin, ACST +09:30, no daylight saving). This is the same format the front-end shows at the top of the digest, but a distinct value: the header is the **digest generation** time (`generated_at`), whereas the battery line is when the sensor was read. In practice they're close, but keep them separate.

**Source links on news items:** End each news item's summary with a `[Read more](<url>)` link followed by the article's hostname in square brackets, e.g. `[Read more](https://www.wired.com/story/...) [wired.com]`. Strip a leading `www.` from the hostname (`www.wired.com` → `wired.com`). Only add this when the email gives a real source URL; if there's no link, just leave the summary as prose.

Choose section ids/titles/icons freely for one-off or ad-hoc content based on what you gathered that day. But keep the recurring ids stable day to day (`centralian-news`, `ai-news`, `apple-news`, `battery`, etc.) so the front-end can rely on them — and remember the three news sections and battery follow the always-include rules above rather than being omitted when empty.

**Publish via git:**
In the repo directory (already pulled by the bootstrap step, reuse it, don't re-clone):
```
git add digest.md
git commit -m "Morning digest payload $(date +%Y-%m-%d)"
git push origin HEAD:main
```
(If you already made a "Consume B8/MCP payload" commit above, this can be `git commit --amend` or a second commit — either is fine, just make sure `git push` happens once at the end with both changes included.)

The raw payload will be reachable at: https://jghaines.github.io/jgh-claude-public/digest.md (served as plain text/markdown — that's expected, it's meant to be fetched by the user's own front-end, not viewed directly).

Do NOT generate or publish any digest.html — that is not this task's responsibility. Do not attempt to verify the public URL by fetching it from inside the sandbox — github.io is not on the sandbox's domain allowlist, so that fetch will always fail even though the URL works fine from the user's phone/browser. This is expected; do not treat it as an upload failure.

**Run summary must state:**
(a) whether any one-time task files (`prompts/<yyyy-mm-dd>.md`) were found, and if so which ones and whether they were deleted after use; (b) whether the Fastmail section succeeded, was empty, or was skipped (and why); (c) whether the Home Assistant battery check succeeded, found no sensors, or was unreachable; (d) which sections were included in today's payload.

Save the generated digest.md to the outputs folder as well for local reference.
