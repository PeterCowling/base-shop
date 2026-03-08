---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-draft-acceptance-rate
Build-date: 2026-03-07
artifact: build-record
---

# Build Record

## Build Summary
Added draft acceptance rate metrics to the reception inbox system. Two tasks completed:

1. **Draft stats API endpoint** (`/api/mcp/inbox/draft-stats`) — queries D1 `thread_events` table using CTEs to classify each thread's draft lifecycle outcome (sent-as-generated, sent-after-edit, regenerated, dismissed). Supports time-window filtering via `?days=N`. Protected by Firebase auth.

2. **MCP tool** (`draft_acceptance_rate`) — registered in the MCP server, calls the reception endpoint with auth headers, and returns both a formatted summary and raw metrics. Accepts optional `days` parameter.

## Tasks Completed
| Task | Description | Commit |
|---|---|---|
| TASK-01 | Draft stats aggregation endpoint | `ee29b9b617` |
| TASK-02 | MCP tool for draft acceptance rate | `ee29b9b617` |

## Validation Evidence
- TypeScript compilation: clean (reception app + MCP server)
- ESLint: clean (after auto-fix import sort)
- Pre-commit hooks: passed (lint-staged + typecheck-staged + lint packages)

## Outcome Contract
- **Why:** No visibility into how often AI-generated drafts are accepted as-is, edited, or rejected — preventing quality measurement and targeted improvement.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Surface draft acceptance rate metrics via MCP tool so operators can track AI draft quality over time.
- **Source:** operator

## Deployment Notes
- Reception app deployment required for the API endpoint to become live
- D1 migration 0004 (from sibling plan `reception-inbox-draft-edit-tracking`) must be applied first
- MCP server rebuild required for the tool to appear in tool listing
- `RECEPTION_AUTH_TOKEN` env var needed in MCP server environment for auth
