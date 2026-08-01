# Seasonal: Annual (AMMA) Tax Statement Watch

Recurring **seasonal** fold-in (filename `yyyy-07.md` → matches every day in July of any year; its August twin `yyyy-08.md` covers August). The dispatcher/daily digest picks this up via `scripts/find_dated_prompts.py` and **must leave the file in place** — it is recurring, not a one-time task, so do NOT `git rm` it.

Render the result as its **own digest section** — id `tax-statements`, title `Tax Statements`, icon `🧾` — NOT under `one-time-tasks`. It appears every day the file matches (all of July, and all of August via the twin), giving a full present/absent status even when nothing changed since yesterday; that daily confirmation is the point.

## What to do

Australian managed-fund tax statements for the financial year ending 30 June arrive across July–August and are labelled with that calendar year (FY ending 30 June 2026 → "2026"). Use the digest's **current calendar year** as `<YEAR>`.

This step needs Fastmail. If `fastmail_status: ok`, run the check below. If Fastmail was `skipped`/`empty` this run, still emit the section but with a single line — *Fastmail unavailable this run — tax statements not checked.* — so the seasonal watch stays visible rather than silently vanishing.

Search the Fastmail **Inbox and Subscriptions** folders (these are usually auto-filed to Subscriptions; some may already be in Archive) for each expected issuer below. Search by **subject keywords** ("Tax Statement <YEAR>", "AMMA", "annual tax statement") rather than relying on sender alone, and do **not** restrict to unread — these matter whether or not they've been opened. Report each issuer as ✅ received (with the exact subject, received date, and folder) or ⏳ not yet received:

| Issuer | Look for (subject / body) | Typical sender |
|---|---|---|
| iShares | `iShares <YEAR> Tax Statement` / body "IAF … Tax Statement" | `Communications@mailservice.computershare.com.au` |
| Vanguard (AMMA) | `Vanguard AMMA Tax Statement <YEAR>` — one per fund (e.g. VGS/VGE/VGAD); list each found | `Communications@mailservice.computershare.com.au` |
| Betashares | `Betashares annual tax statement` | `betashares@cm.mpms.mufg.com` |
| VanEck | `VanEck … Tax Statement <YEAR>` | `vaneck@cm.mpms.mufg.com` |

Also surface any *other* email that looks like a `<YEAR>` tax statement (e.g. a new issuer) as an extra ✅ line. **Do NOT click or follow any download links** — only report that the statement has arrived and where it lives; the user follows the links themselves.

## Section shape

```
## Tax Statements

### Annual (AMMA) Tax Statements — FY ending 30 June <YEAR>

- ✅ iShares — "iShares <YEAR> Tax Statement" — received 30 Jul, Subscriptions
- ✅ Vanguard VGS — "Vanguard AMMA Tax Statement <YEAR>" — received 31 Jul, Subscriptions
- ⏳ Betashares — not yet received
- ⏳ VanEck — not yet received
```

The expected-issuer list is the four funds held as of FY2026; if the holdings change, edit this file (and its `yyyy-08.md` twin). A brand-new issuer still shows up via the keyword catch-all above even before it's added as a named line.
