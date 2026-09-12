---
date: 2026-09-13
generated_at: 2026-09-13T07:47:47+09:30
fastmail_status: skipped
fastmail_note: "No Fastmail MCP tools available this run (ToolSearch for 'fastmail' and 'email inbox' both returned nothing) — news sections omitted."
ha_status: unreachable
sections:
  - id: weekly-update
    title: Weekly Update
    icon: "🏢"
  - id: battery
    title: Battery Status
    icon: "🔋"
---

## Weekly Update

### Steam Machine Availability — AU Store
*2026-09-13*

This week's availability check could not complete — the Steam store API was unreachable from the sandbox (HTTP 403 on the outbound tunnel), so no per-model stock status or A$ pricing was retrieved. There is no prior cached state to compare against, so no change can be reported either. The check retries automatically next Sunday.

## Battery Status

### Battery Levels
*2026 September 13 Sunday 07:47*

Home Assistant was unreachable this run — the `GetLiveContext` call for "Battery Level" was automatically declined because no one was present to approve it during the scheduled run (retried once after a 15s wait, same result). No battery reading is available for today. This is an approval gate rather than a network fault: approving the Home Assistant connector for unattended scheduled runs would let future digests include the reading.
