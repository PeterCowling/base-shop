---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-draft-edit-tracking
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-draft-edit-tracking/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307140500-9050
Trigger-Why: Staff edits to AI-generated drafts are lost — the original generated text is overwritten on save, preventing any diff-based learning or quality feedback loop.
Trigger-Intended-Outcome: "type: operational | statement: Preserve original generated draft text alongside staff edits so downstream systems can compute diffs and learn from corrections | source: operator"
---

# Reception Inbox Draft Edit Tracking Fact-Find Brief

## Scope
### Summary
When a staff member edits an AI-generated email draft in the reception inbox, the PUT handler overwrites `plain_text` with the edited version and sets `status: "edited"`. The original generated text is permanently lost — there is no `original_plain_text` column or snapshot mechanism. This prevents any diff-based analysis of what staff changed and why, blocking a feedback loop that could improve future draft generation quality.

### Goals
- Preserve the original AI-generated draft text when staff edits are saved
- Enable downstream diff computation between generated and edited versions
- Feed edit patterns into the existing self-improving draft system (template/ranker calibration)

### Non-goals
- Building the analysis/learning pipeline itself (that's a separate concern — IDEA-DISPATCH-20260307140500-9051)
- Changing the staff editing UX
- Modifying the MCP server's draft generation logic

### Constraints & Assumptions
- Constraints:
  - D1 database (Cloudflare) — schema migration required for new column
  - Production data in `reception-inbox` D1 database (database_id: f3ed1b8f-cb6a-4950-9bfa-8f85a0913db9)
  - Must not break existing draft lifecycle (generated → edited → approved → sent)
- Assumptions:
  - Adding a nullable TEXT column to `drafts` table is a non-breaking migration
  - The `regenerate` endpoint already stores the full generated text — we capture it there
  - Storage cost of duplicate text is negligible (email bodies are small)

## Outcome Contract
- **Why:** Staff edits to AI-generated drafts are lost — the original generated text is overwritten on save, preventing any diff-based learning or quality feedback loop.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Preserve original generated draft text alongside staff edits so downstream systems can compute diffs and learn from corrections.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts` — PUT handler that overwrites `plain_text` on staff edit
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts` — POST handler that generates new draft via `generateAgentDraft()`

### Key Modules / Files
- `apps/reception/src/lib/inbox/repositories.server.ts` — `InboxDraftRow` type definition, `updateDraft()` and `insertDraft()` functions
- `apps/reception/src/lib/inbox/telemetry.server.ts` — event recording (draft_edited, drafted, approved, sent)
- `apps/reception/src/lib/inbox/draft-core/interpret-thread.ts` — thread context summarization for draft generation
- `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts` — send handler (reads current `plain_text`)
- `apps/reception/wrangler.toml` — D1 binding configuration

### Patterns & Conventions Observed
- Draft status enum: `"generated" | "edited" | "approved" | "sent"` — evidence: `repositories.server.ts`
- Telemetry events recorded for each lifecycle transition — evidence: `telemetry.server.ts`
- D1 SQL migrations applied via wrangler — evidence: `wrangler.toml` + existing schema

### Data & Contracts
- Types/schemas/events:
  - `InboxDraftRow`: id, thread_id, gmail_draft_id, status, subject, recipient_emails_json, plain_text, html, template_used, quality_json, interpret_json, created_by_uid, created_at, updated_at
  - No `original_plain_text` or `original_html` column exists
  - Event types: admitted, auto_archived, review_later, drafted, draft_edited, approved, sent, resolved, dismissed
- Persistence:
  - Cloudflare D1 `reception-inbox` database
  - `drafts` table with TEXT columns for plain_text (NOT NULL) and html (nullable)
- API/contracts:
  - PUT `/api/mcp/inbox/[threadId]/draft` — accepts `{ plainText, html?, subject?, recipientEmails? }`, sets status to "edited"
  - POST `/api/mcp/inbox/[threadId]/draft/regenerate` — generates new draft, sets status to "generated"

### Dependency & Impact Map
- Upstream dependencies:
  - `generateAgentDraft()` in MCP server — produces the original text
  - Gmail API — source of thread messages
- Downstream dependents:
  - Send handler reads `plain_text` from drafts table — unaffected (reads current version)
  - `useInbox.ts` client hook — reads draft data via API — needs `originalPlainText` field if UI wants to show diff
  - Existing self-improving system (`email-draft-self-improving-system` plan, Status: Complete) — currently operates on MCP server template/ranker level, not staff edits
- Likely blast radius:
  - `drafts` table schema (migration)
  - `repositories.server.ts` (type + insert/update functions)
  - `regenerate/route.ts` (set original text on generation)
  - `draft/route.ts` PUT handler (preserve original on edit)
  - `useInbox.ts` type (`InboxDraft` type extension — optional field)

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (CI-only per `docs/testing-policy.md`)
- Commands: `pnpm -w run test:governed`
- CI integration: Tests run in CI only, never locally

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Inbox presentation | Unit | `apps/reception/src/components/inbox/__tests__/` | stripQuotedContent, badges, timestamps |
| Draft API routes | None | — | No test files for draft route handlers |
| Repositories | None | — | No test files for repository functions |

#### Coverage Gaps
- No tests for draft PUT/regenerate route handlers
- No tests for repository insert/update functions

#### Testability Assessment
- Easy to test: repository functions (pure DB operations), type additions
- Hard to test: D1 migration (requires D1 miniflare environment)

#### Recommended Test Approach
- Unit tests for: repository function changes (mock D1 binding)
- Integration tests for: not needed at this scope — the change is a simple column addition + capture

### Recent Git History (Targeted)
- `apps/reception/src/lib/inbox/` — draft-core and repositories recently stable; last major change was email-draft-self-improving-system (Complete)

## Questions
### Resolved
- Q: Does the existing self-improving system already capture staff edits?
  - A: No. The `email-draft-self-improving-system` plan (Status: Complete) covers MCP server template/ranker self-improvement. It operates on signal events (`draft-signal-events.jsonl`) from the agent pipeline, not staff edits in the reception app.
  - Evidence: `docs/plans/email-draft-self-improving-system/plan.md`

- Q: Where is the best place to capture the original text?
  - A: At regeneration time — when `generateAgentDraft()` produces the draft and `insertDraft()` is called. The `plain_text` at insert time IS the original generated text. We store it in a new `original_plain_text` column. On subsequent PUT edits, this column remains untouched.
  - Evidence: `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts`

- Q: Should we also capture original HTML?
  - A: Yes, for completeness. Add `original_html` alongside `original_plain_text`. The html field is nullable, so `original_html` should also be nullable.
  - Evidence: `repositories.server.ts` — html is already nullable in `InboxDraftRow`

### Open (Operator Input Required)
No open questions — all decisions can be resolved from available evidence.

## Confidence Inputs
- Implementation: 95% — straightforward D1 column addition + capture at insert time
  - Evidence: clear entry points, simple schema change, no complex logic
  - >=90: already there
- Approach: 90% — single clear approach (new column, capture at generation time)
  - Evidence: no alternative approaches compete; this is the standard pattern
  - >=90: already there
- Impact: 85% — enables future learning but value depends on downstream analysis pipeline
  - Evidence: staff edits are currently lost permanently; this unblocks diff computation
  - >=90: would need downstream consumer (acceptance rate idea) to be planned
- Delivery-Readiness: 90% — all code paths identified, schema change is simple
  - >=90: already there
- Testability: 75% — repository functions testable but D1 migration testing is limited
  - >=80: add miniflare-based test or verify via manual D1 query post-deploy
  - >=90: full integration test with D1 miniflare

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| D1 migration failure in production | Low | High | Test migration on local D1 first; migration is additive (nullable column) so rollback is safe |
| Original text not set for drafts created before migration | N/A | Low | Historical drafts will have NULL original_plain_text — acceptable; only new drafts capture it |
| Storage increase from duplicate text | Very Low | Very Low | Email bodies are typically <10KB; D1 has generous storage limits |

## Planning Constraints & Notes
- Must-follow patterns:
  - D1 migrations via SQL files in `apps/reception/migrations/`
  - TypeScript type updates in `repositories.server.ts`
  - API response type updates in `useInbox.ts` for client consumption
- Rollout/rollback expectations:
  - Additive migration (nullable columns) — safe to deploy without rollback plan
  - Old code works fine with new columns (they're nullable and unused until read)
- Observability expectations:
  - `draft_edited` telemetry event already exists — can add metadata about whether original was captured

## Suggested Task Seeds (Non-binding)
1. Add `original_plain_text` and `original_html` columns to `drafts` table (D1 migration)
2. Update `InboxDraftRow` type and repository functions to handle new columns
3. Capture original text at draft generation time (regenerate route)
4. Expose `originalPlainText` in API response types (for future UI diff view)

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - D1 migration file added and applied
  - `original_plain_text` populated on new draft generation
  - `original_plain_text` preserved (not overwritten) on PUT edits
  - TypeScript types updated across the stack
- Post-delivery measurement plan:
  - After deploy, generate a draft and edit it; query D1 to verify `original_plain_text` is preserved
  - Monitor `draft_edited` events to confirm continued operation

## Scope Signal
- **Signal:** right-sized
- **Rationale:** Single-surface change (drafts table + 3-4 files), no architectural decisions, clear validation path. No evidence supports expanding scope — the downstream analysis pipeline is a separate dispatch.

## Evidence Gap Review
### Gaps Addressed
- Confirmed no existing mechanism preserves original draft text (checked D1 schema, repository types, route handlers)
- Confirmed self-improving system operates on a different surface (MCP server, not reception app)
- Identified exact code paths for capture (regenerate route) and preservation (PUT route)

### Confidence Adjustments
- No adjustments needed — all entry points verified directly

### Remaining Assumptions
- D1 supports ALTER TABLE ADD COLUMN for nullable TEXT columns (well-documented SQLite capability)

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| D1 schema migration | Yes | None | No |
| Repository type + function updates | Yes | None | No |
| Regenerate route (capture point) | Yes | None | No |
| PUT route (preservation point) | Yes | None | No |
| Client type updates | Yes | None | No |
| Existing self-improving system overlap | Yes | None — confirmed separate surface | No |

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-inbox-draft-edit-tracking --auto`
