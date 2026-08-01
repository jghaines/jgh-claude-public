# Digest Dispatcher — single entry point

The one scheduled task reads and executes **this** file every run. It replaces the
old per-cadence tasks (daily / weekly / monthly): the schedule now lives in the
prompt **filenames** under `prompts/` (see AGENTS.md "Prompt scheduling by
filename"), and this dispatcher fires whichever ones match today.

This file's own name starts with `_`, so the matcher never returns it.

## Step 1 — find what matches today

From the repo directory (already shallow-cloned by the bootstrap; use `$REPO`):
```
python3 scripts/find_dated_prompts.py --contents
```
This prints a JSON array; each entry has `path`, `pattern`, `role`, `recurring`,
and `contents`. Roles and how to treat them:

| role | what it is | dispatcher action |
|---|---|---|
| `daily` | the digest generator (`yyyy-mm-dd.md`), matches every day | run LAST, always |
| `weekly` | self-contained runner (`…-sun.md`), writes its own payload/output | run in Step 2 |
| `monthly` | self-contained runner (`yyyy-mm-01.md`), writes its own payload/output | run in Step 2 |
| `seasonal` / `annual` / `one-time` | **content**, not a runner | do NOT run here — the daily generator folds these into `digest.md` itself (Step 3) |

Never delete a file with `recurring: true`. Only the daily generator deletes the
`recurring: false` one-time files it consumes.

## Step 2 — run the matched runners (monthly, then weekly)

For each match whose role is `monthly` or `weekly`, execute that file's `contents`
in full, exactly as written, using `$REPO` for all git operations. Run `monthly`
before `weekly`, and both before the daily digest, so any `payloads/*-pending.md`
they write are on disk before the digest consumes them **in the same run** (this is
the one behavioural change from the old setup — payloads no longer wait a day).
If neither matched today, skip this step — that's the normal case.

## Step 3 — run the daily digest (always)

Execute `prompts/yyyy-mm-dd.md` in full. It generates `digest.md`, consuming any
pending payloads from Step 2 and folding in today's `seasonal` / `annual` /
`one-time` content files as sections (it re-reads the matcher output itself, so you
don't need to hand it anything). It ends with the `git add` / `commit` / `push`.

## Step 4 — verify a clean push

The runner files and the daily digest each commit and push. A shallow clone on a
single branch makes these fast-forward, so multiple pushes in one run are fine.
Before finishing, confirm:
```
git status --porcelain                 # empty (nothing uncommitted)
git log origin/main..HEAD --oneline    # empty (nothing unpushed)
```
If either is non-empty, `git push origin HEAD:main` once more. Do NOT fetch the
`github.io` URL to "verify" — that domain isn't on the sandbox allowlist and always
fails even on a good push; a clean `git log origin/main..HEAD` is the verification.

## Report

State: which files matched today (pattern + role); for each runner, its own required
run-summary; for the daily digest, everything `prompts/yyyy-mm-dd.md` asks it to
report; and the final commit SHA(s) pushed (or an explicit statement that nothing was
pushed and why).
