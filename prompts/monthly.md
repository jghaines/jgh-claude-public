# Monthly B8/MCP Search

Search the web for recent developments and generate a monthly findings report. Include only highlights/noteworthy findings.

**Search topics:**
1. **B8 Competitors in Australia**: Search for news and updates about B8 competitors operating in Australia (e.g., new funding, product launches, market moves, partnerships)
2. **New MCPs**: Search for:
   - New Facebook MCP or updates to existing Facebook integrations
   - Other new MCPs relevant to Claude workflows and automation
   - Any MCP updates or releases in the past month

**Output format:**
Do NOT generate a standalone HTML file or upload anything to S3 — this task only produces a payload that the daily-morning-digest task will pick up and fold into a future digest.

Write the findings as a single Markdown file with this structure:
```
## B8 Competitors & MCP Update — <today's date>

### B8 Competitors in Australia
- finding 1 (with source link)
- finding 2 ...
(omit this subsection entirely if nothing noteworthy)

### New MCPs
- finding 1 (with source link)
- finding 2 ...
(omit this subsection entirely if nothing noteworthy)
```
If there is nothing noteworthy in either topic this month, write the file containing only a header line: `## B8 Competitors & MCP Update — <today's date>\n\n_No noteworthy findings this month._`

**Publish the payload via git:**
In the repo directory (already pulled by the bootstrap step):
```
mkdir -p payloads
# write the markdown content above to payloads/b8-mcp-pending.md, OVERWRITING any existing file
git add payloads/b8-mcp-pending.md
git commit -m "Monthly B8/MCP findings $(date +%Y-%m-%d)"
git push origin HEAD:main
```

Note: `payloads/b8-mcp-pending.md` is a queue of exactly one pending item — this task always overwrites it. The daily-morning-digest task is responsible for consuming (reading, folding into a digest, then deleting) this file, so if it's still present when this task runs again next month, it means the daily task hasn't picked it up yet; overwriting with the newest findings is still the correct behavior.

**Run summary must state:** which topics had noteworthy findings, if any.

Also save the markdown file to the outputs folder for local reference.
