#!/bin/sh
# ha-mcp-proxy.sh — Home Assistant MCP connector launcher.
#
# Referenced by ~/Library/Application Support/Claude/claude_desktop_config.json as the
# "Home Assistant" mcpServer `command`. It probes the known Home Assistant endpoints in
# order of robustness and exec()s mcp-proxy against the first one that answers, so a flaky
# mDNS `.local` lookup can no longer take the whole connector down on its own — the
# diagnosed root cause of the intermittent `ha_status: unreachable` mornings.
#
# Endpoint order (see AGENTS.md "Home Assistant connectivity" for the why):
#   1. DHCP-pinned LAN IP   — no name resolution at all (removes the mDNS root cause)
#   2. Tailscale MagicDNS   — resolved via tailscaled, works even when off the home LAN
#   3. mDNS .local          — last resort / original behaviour
#
# This repo copy is the source of truth. It must be INSTALLED to the stable Mac path the
# desktop config points at (the config runs persistently on the Mac, not from the
# ephemeral scheduled-task clone):
#   cp scripts/ha-mcp-proxy.sh /Users/jasonhaines/Claude/ha-mcp-proxy.sh && chmod +x "$_"
# then restart the Claude desktop app for the connector to pick it up.

CURL=/usr/bin/curl
MCP_PROXY=/opt/homebrew/bin/mcp-proxy

for base in \
  "http://192.168.0.114:8123" \
  "http://homeassistant.tail1f72e6.ts.net:8123" \
  "http://homeassistant.local:8123"
do
  # HA answers / with an HTTP status (200, or 401 when unauthenticated) whenever it is up;
  # curl exits 0 on any completed HTTP response and non-zero only when it cannot connect.
  # That is exactly the reachability test we want here.
  if "$CURL" -s -o /dev/null --max-time 4 "$base/" 2>/dev/null; then
    exec "$MCP_PROXY" --transport=streamablehttp --stateless "$base/api/mcp"
  fi
done

# Nothing answered the probe. Still start against .local so the connector comes up at all
# and the per-call retry in prompts/yyyy-mm-dd.md gets its chance, rather than failing to launch.
exec "$MCP_PROXY" --transport=streamablehttp --stateless "http://homeassistant.local:8123/api/mcp"
