# Daily Morning Digest

Generate a morning digest payload for the user. This task produces ONLY a structured markdown+frontmatter data file (`digest.md`) at the repo root — it does NOT generate any HTML. The user maintains their own HTML/JS front-end separately that fetches and renders this payload (with its own theme handling, layout, etc.). Your job is strictly content: gather the data, write it in the schema below, and publish it.

**Data sources:**
1. **Fastmail Summary**: The Fastmail MCP connector IS connected to this account (confirmed working — do not assume it's unavailable). At the start of this task, call ToolSearch with query "fastmail" (or "select:mcp__fastmail" style queries) to load the Fastmail MCP tools, then use them to check the Inbox and Subscriptions folders for unread messages since yesterday. Only treat Fastmail as unavailable if ToolSearch genuinely returns no Fastmail tools after trying at least two query variations (e.g. "fastmail", "email inbox").

2. **Centralian News**: Extract highlights from Fastmail inbox messages (requires step 1 to have worked). Include links to centr

3. **AI News**: Extract highlights from Fastmail inbox messages (requires step 1 to have worked)

4. **Apple Company Info**: Search the web for recent news or updates. Only include important news.

5. **Scheduled payload**: See step below — include only if a pending payload file exists.

Only include a section in the output if it has noteworthy content. Skip empty sections entirely (omit from both frontmatter `sections` list and body).

**Check for Scheduled payload (do this first, before generating the digest):**
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
sections:
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
  (only list sections that actually have content below, in the order they appear in the body)
---

## AI News

### <Item title>
*<timestamp, e.g. "July 21">*

<1-3 sentence summary. Include source links as markdown links where available.>

### <Next item title>
*<timestamp>*

<summary>

## Apple News

### <Item title>
*<timestamp>*

<summary>
```
Use `##` headers matching each section's `title` from frontmatter, and `###` per item within a section, followed by an italic timestamp line, then a short prose summary (with markdown links to sources where relevant). Keep summaries tight — 1-3 sentences, no bullet lists needed.

Choose section ids/titles/icons freely based on what content you actually gathered that day (e.g. don't force "Apple News" if there's nothing noteworthy — just omit it). The ids above are just the recurring ones; keep them consistent day to day so the front-end can rely on stable ids for known categories.

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
(a) whether the Fastmail section succeeded, was empty, or was skipped (and why); (b) which sections were included in today's payload.

Save the generated digest.md to the outputs folder as well for local reference.
