---
Type: Report
Status: Historical
Domain: Automation
Created: 2026-02-02
Last-updated: 2026-02-02
Relates-to: docs/plans/email-autodraft-consolidation-plan.md
---

# Email Autodraft Consolidation — Security & Logging Review

## Scope
Review the new email autodraft pipeline and related MCP tools for:
- PII exposure in logs
- Email body persistence beyond session
- Prompt-injection resilience

## Files Reviewed
- `packages/mcp-server/src/tools/draft-interpret.ts`
- `packages/mcp-server/src/tools/draft-generate.ts`
- `packages/mcp-server/src/tools/draft-quality-check.ts`
- `packages/mcp-server/src/tools/gmail.ts`
- `packages/mcp-server/src/utils/template-ranker.ts`
- `packages/mcp-server/src/utils/workflow-triggers.ts`
- `packages/mcp-server/src/utils/template-lint.ts`
- `packages/mcp-server/src/resources/*` (draft-guide, voice-examples, email-examples)
- `packages/mcp-server/src/server.ts`
- `packages/mcp-server/src/clients/gmail.ts`

## Findings

### 1) Logging
**Status:** OK
- No logging of email bodies or customer PII in the new tools.
- Logging is limited to server-level errors and Gmail setup status in `packages/mcp-server/src/server.ts` and `packages/mcp-server/src/clients/gmail.ts`.
- No new logs were introduced in the email interpretation/composition/quality modules.

### 2) Data Retention
**Status:** OK
- No email body persistence beyond the tool call lifecycle.
- Caches are used only for static resources and templates:
  - `draft-guide.json`, `voice-examples.json`, `email-examples.json`, and `email-templates.json`.
- No email content is stored in caches or written to disk.

### 3) Prompt Injection Mitigations
**Status:** OK
- Email content is passed as data (structured inputs) into interpretation and composition tools.
- `draft_interpret` produces a structured `EmailActionPlan` which constrains downstream generation.
- `draft_quality_check` enforces rules that prevent prohibited claims and obvious contradictions.

## Risks & Recommendations

| Risk | Recommendation | Priority |
|------|----------------|----------|
| Future logging additions could capture PII | Keep logging in tools limited to metadata; avoid logging full email bodies. | Medium |
| Caches could accidentally include email content | Ensure caches remain limited to static resources/templates only. | Medium |
| Prompt injection in future LLM prompts | Continue to treat emails as data; keep rule-based quality gate as backstop. | Medium |

## Conclusion
No PII logging or email persistence issues found in the current implementation. The structured pipeline and quality gate provide reasonable guardrails against prompt injection. Ongoing vigilance is required if logging or caching is expanded.
