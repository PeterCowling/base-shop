---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-prime-template-responses
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-prime-template-responses/fact-find.md
Related-Plan: docs/plans/reception-prime-template-responses/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Prime Template Responses Analysis

## Decision Frame
### Summary
Staff replying to Prime guest messages write every response from scratch, despite the Prime app already containing a rule-based Q&A engine (`answerComposer.ts`) with well-written answers and links for the six most common question categories. This analysis determines how to surface those answers as selectable templates in the reception draft UI, with a path toward self-improvement over time.

The decision is between three viable storage and delivery approaches: a static TypeScript module, a D1 database-backed system with a learning loop, and a shared package that reuses `answerComposer` directly. The choice affects complexity, time-to-value, and the feasibility of a future self-improvement loop.

### Goals
- Staff can select a template response when replying to common Prime guest questions, reducing reply time from minutes to seconds
- Template selection is tracked (`templateUsed` field) so adoption can be measured
- The architecture supports adding a self-improvement loop in a future phase without rework

### Non-goals
- Automated template management UI (Phase 2)
- LLM-based template suggestion beyond keyword matching (Phase 2)
- Self-improvement loop that captures manual replies as template candidates (Phase 2)
- Template analytics dashboard (Phase 2)

### Constraints & Assumptions
- Constraints:
  - Prime direct channel has `supportsDraftRegenerate: false` — no AI-generated drafts exist, so templates are the primary draft acceleration mechanism
  - The draft save API (`PUT /api/mcp/inbox/{threadId}/draft`) uses a strict zod schema that currently lacks a `templateUsed` field — either the schema must be extended or tracking stays client-side
  - `answerComposer.ts` answers are EN-only (marked `PRIME-01 [ttl=2027-06-30]`); IT translations must be created manually
  - Template count is small (<20) and changes infrequently
- Assumptions:
  - Staff will adopt templates when they are prominent and one-click (supported by the pattern that auto-draft adoption is high for email threads)
  - The 6 answerComposer categories cover the most common Prime guest questions (supported by the 10 preset questions in Homepage.json covering the same topics)
  - Prime internal links (`/booking-details`, `/activities`, etc.) render as tappable links in Prime chat messages (supported by the `links` field in message objects)

## Inherited Outcome Contract

- **Why:** When guests message through Prime, staff have no pre-written answers to draw from. Every reply is written from scratch, even for common questions. The Prime app already has a rule-based Q&A agent with good answers and links, but that knowledge is not available to staff replying in the reception inbox. Making those answers available as templates means faster responses and consistently helpful answers.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can select from template responses when replying to Prime messages, each giving a clear answer plus a link for more detail. When staff write a manual reply to a question no template covers, the system captures that as a candidate for a new template — building the knowledge base over time.
- **Source:** dispatch

## Fact-Find Reference
- Related brief: `docs/plans/reception-prime-template-responses/fact-find.md`
- Key findings used:
  - `answerComposer.ts` has 7 keyword-matching branches across 6 categories, each returning structured `AssistantAnswer` objects with answer text, category, and links (L47-136)
  - `InboxDraft` type already has `templateUsed: string | null` field (useInbox.ts L32) and DraftReviewPanel renders a badge when set (DraftReviewPanel.tsx L240-243) — template tracking plumbing exists
  - Prime direct channel adapter: `supportsDraftRegenerate: false`, `supportsDraftSave: true` — templates fill the "no auto-draft" gap
  - Draft save zod schema (`updateDraftPayloadSchema`) lacks `templateUsed` — only `subject`, `recipientEmails`, `plainText`, `html` are accepted
  - EN + IT preset questions exist in `Homepage.json` but answer text is EN-only in `answerComposer.ts`
  - The Prime draft save path (`savePrimeInboxDraft`) only passes `plainText` through to the Prime API

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Time-to-value | Staff are writing every reply from scratch today; faster delivery = faster ROI | High |
| Implementation complexity | Smaller scope = less risk, faster build, fewer moving parts | High |
| Self-improvement extensibility | The long-term value is in growing the template set from manual replies | Medium |
| Maintenance burden | Templates change infrequently; avoid infrastructure overhead for a small dataset | Medium |
| i18n support | Staff serve EN and IT guests; both languages needed | Medium |
| Codebase pattern fit | Approaches matching existing patterns are cheaper to review and maintain | Low |
| Data drift risk | Two sources of truth for the same answers create maintenance debt | Low |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Static TypeScript module | Templates as a typed TS array in reception app, derived from answerComposer. Template picker in DraftReviewPanel. `templateUsed` tracked client-side. | Simplest. No API, no DB, no migration. Build-time validated. Highly testable (pure function). | Adding templates requires a code deploy. Two sources of truth with answerComposer. | Data drift between answerComposer and template file | Yes |
| B: D1 database-backed with learning loop | Templates in a D1 table with CRUD API. Keyword matching server-side. Manual replies flagged as candidates in same table. Staff promote candidates via management UI. | Dynamic updates without deploy. Self-improvement loop is native. Single source of truth in DB. | Requires D1 migration, new API endpoints, management UI, server-side matching logic. Significantly larger scope. | Over-engineering for <20 templates. Management UI is a separate feature. | Yes |
| C: Shared package reusing answerComposer | Extract `answerComposer` logic into a shared package (`packages/prime-templates`). Both Prime app and reception import from it. Self-improvement feeds into shared package. | Single source of truth. Both apps benefit from improvements. | Couples Prime app and reception at the package level. `answerComposer` uses `i18n-exempt` strings — shared package would need i18n support added. Link format differs (Prime internal paths vs staff-facing context). Cross-app coupling for a small dataset. | Package coupling creates coordination overhead for changes. i18n retrofit of answerComposer is a separate workstream. | Yes |

## Engineering Coverage Comparison
| Coverage Area | Option A: Static TS Module | Option B: D1 Database | Option C: Shared Package | Chosen implication |
|---|---|---|---|---|
| UI / visual | New TemplatePicker component in DraftReviewPanel, channel-gated to Prime threads | Same picker, plus a management UI for template CRUD | Same picker, no management UI | Option A: single new component, contained scope |
| UX / states | Empty state (no match), keyword-matched suggestions, category browsing, one-click populate | Same, plus candidate promotion workflow states | Same as A | Option A: three states (suggestions, browsing, empty), all client-side |
| Security / privacy | N/A — internal staff tool, hardcoded text, no user input injection | Requires auth on CRUD endpoints, input validation on template content | N/A — shared package is build-time code | Option A: N/A, no new attack surface |
| Logging / observability / audit | `templateUsed` field on draft tracks adoption; null value signals manual reply | Same, plus candidate capture logging in D1 | Same as A | Option A: existing `templateUsed` plumbing is sufficient for v1 observability |
| Testing / validation | Pure function: message in, ranked templates out. Highly unit-testable. Integration test for picker-to-textarea flow. | Same unit tests plus API endpoint tests, migration tests, management UI tests | Same unit tests plus cross-app integration tests for shared package | Option A: fewest test surfaces, highest confidence per test |
| Data / contracts | New `PrimeTemplate` type. `InboxDraftUpdateInput` optionally extended with `templateUsed`. Static array, no schema migration. | D1 schema migration for `prime_templates` table. New API contract for CRUD. Zod schemas for template input/output. | Shared package exports `PrimeTemplate` type. Both apps depend on package contract. | Option A: one new type, optional field addition, no migration |
| Performance / reliability | Client-side O(n) keyword scan over <20 items — instant. No network calls for template data. | Server-side query on each thread open. Adds latency and a failure mode. | Same as A (build-time import). | Option A: zero-latency template lookup |
| Rollout / rollback | Deploy new code. Rollback = deploy previous version. No data to migrate or clean up. | Deploy code + run D1 migration. Rollback requires migration rollback. Data cleanup if rolled back after templates are created. | Deploy shared package + both consuming apps. Rollback requires coordinated deploy of both apps. | Option A: simplest rollout — single app deploy, no migration, no coordination |

## Chosen Approach
- **Recommendation:** Option A — Static TypeScript module in the reception app
- **Why this wins:** It delivers the core value (staff can select pre-written answers for common questions) with the least complexity. The template dataset is small (<20 items), changes infrequently, and is derived from a stable, production-tested source (`answerComposer.ts`). The existing `templateUsed` plumbing in `InboxDraft` and `DraftReviewPanel` means the tracking infrastructure already exists. A static module is build-time validated, trivially testable (pure function: message text in, ranked suggestions out), and adds no new failure modes (no API calls, no DB queries, no migrations). The self-improvement loop (capturing manual replies as template candidates) is explicitly Phase 2 — the core value is in surfacing existing knowledge, not in learning from manual replies.
- **What it depends on:**
  - IT translations of the 7 answerComposer answer texts (manageable: <10 short paragraphs)
  - Extending `InboxDraftUpdateInput` and the draft save zod schema to optionally accept `templateUsed` (one optional string field)
  - The Prime draft save path (`savePrimeInboxDraft`) storing `templateUsed` on the draft record

### Rejected Approaches
- **Option B (D1 database-backed)** — Over-engineered for the current dataset size and change frequency. Adds a D1 migration, CRUD API endpoints, and a management UI — each of which is a feature in its own right. The self-improvement loop it enables is explicitly out of scope for v1. If template volume grows significantly or dynamic updates become necessary, this can be introduced as a Phase 2 migration without rework (the `PrimeTemplate` type from Option A maps directly to a D1 table schema).
- **Option C (Shared package)** — Creates cross-app coupling for a small dataset. The `answerComposer` in Prime is marked `i18n-exempt` and uses hardcoded EN strings; retrofitting it for i18n is a separate workstream. The link formats differ between guest-facing (Prime app) and staff-facing (reception) contexts. Shared packages in this codebase have proven coordination overhead (see TypeScript `paths` inheritance gotcha in memory). The benefit of a single source of truth does not justify the coupling cost when the dataset is 7 answers that change rarely.

### Open Questions (Operator Input Required)
- Q: Should templates include the full answerComposer answers as-is, or should staff-facing versions be rewritten?
  - Why operator input is required: Current answers address the guest directly ("Use Booking Details to check your stay...") — this tone works for staff sending to guests, but the operator may want adjustments.
  - Planning impact: If rewrites are needed, it adds a content task. If as-is is acceptable, templates can be extracted directly.
- Q: Should templates be available for Prime broadcast threads too, or only Prime direct (support) threads?
  - Why operator input is required: Broadcast is promotional, templates are support-oriented. The operator knows the use case better.
  - Planning impact: Affects channel-gating logic in the TemplatePicker component (trivial code difference, but scoping matters).
- Q: Should the template picker auto-suggest based on the guest's latest message, or show a category-grouped list for manual browsing?
  - Why operator input is required: UX preference. Auto-suggest is smarter but may feel restrictive. Category browsing is simpler but requires more clicks.
  - Planning impact: Both are feasible. The recommendation is to do both — auto-suggest first, with a "Browse all" fallback — but the operator may prefer simplicity.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Staff reply to Prime guest questions | Staff reads question, mentally recalls answer, types full reply from scratch (2-5 min per reply) | Staff opens a Prime thread in the reception inbox | 1. Staff opens Prime thread. 2. TemplatePicker shows keyword-matched suggestions based on latest inbound message. 3. Staff clicks a template to populate the textarea (can edit before sending). 4. Staff clicks Save then Send. `templateUsed` is recorded. Total time: ~30 seconds for template matches. | Email thread draft flow is unchanged. Prime thread listing/sync is unchanged. Send flow is unchanged (only the content source changes). | If keyword matching gives poor suggestions for ambiguous messages, staff fall back to category browsing or manual typing. |
| Template maintenance | No templates exist | Operator identifies a new common question not covered by existing templates | Operator (or agent) adds a new entry to the static TS template array and deploys. | answerComposer.ts in Prime app is unchanged — it remains the guest-facing Q&A engine. Templates are a separate, reception-specific data source. | Data drift between answerComposer and reception templates. Mitigated by periodic reconciliation. Future Phase 2 could unify via D1. |
| Draft tracking | `templateUsed` field exists on `InboxDraft` but is always null for Prime threads | Staff selects a template before saving | `templateUsed` is set to the template ID on save. DraftReviewPanel badge shows which template was used. Null value on sent drafts signals a manual reply (observable for future self-improvement). | Draft save/send mechanics unchanged. | `templateUsed` must flow through the save API — requires schema extension. |

## Planning Handoff
- Planning focus:
  - Template data file: extract answerComposer answers into a typed TS module with `id`, `category`, `keywords`, `answerEN`, `answerIT`, `links` per template. 7 template entries (one per answerComposer branch, excluding the empty-input fallback).
  - TemplatePicker component: new UI component rendered above the textarea in DraftReviewPanel, gated to Prime threads. Shows keyword-matched suggestions from the latest inbound message, with a "Browse all" category fallback.
  - Template selection: clicking a template sets `plainText` state and a local `templateUsed` identifier.
  - Draft save integration: extend `updateDraftPayloadSchema` with optional `templateUsed: z.string().optional()`, and thread it through `savePrimeInboxDraft` to the Prime API (or store client-side if the Prime API doesn't support it).
  - IT translations: create IT answer text for all 7 templates. Use `Homepage.json` IT preset questions as reference material.
- Validation implications:
  - Unit tests: template matching function (pure function: message string in, ranked `PrimeTemplate[]` out)
  - Integration tests: TemplatePicker renders in DraftReviewPanel for Prime threads, clicking a template populates textarea, `templateUsed` is included in save payload
  - Accessibility: keyboard navigation of template list, screen reader labels on template items
- Sequencing constraints:
  - Template data file must be created before TemplatePicker component (data dependency)
  - IT translations can happen in parallel with component work
  - Draft save schema extension must happen before integration tests that verify `templateUsed` persistence
- Risks to carry into planning:
  - IT translation quality — operator review needed before merge
  - The Prime draft save API (`PUT /api/review-thread-draft` on the Prime side) may not accept `templateUsed` — if not, tracking is client-side only (still visible in DraftReviewPanel badge, but not persisted server-side for Prime threads)

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Template answers drift from answerComposer over time | Medium | Low | Acceptable for v1 — templates are a snapshot of existing answers. Periodic reconciliation is sufficient. Phase 2 D1 storage could unify. | Plan should document the reconciliation expectation. |
| IT translation quality is lower than EN | Medium | Low | Translations require human judgment; cannot be resolved at analysis stage. | Plan should include operator review of IT text as a gate before merge. |
| Prime draft save API may not accept `templateUsed` | Low | Low | Requires testing against the live Prime API during build. Client-side tracking is a viable fallback. | Plan should include a probe task to check Prime API acceptance of extra fields, with a fallback path. |
| Keyword matching gives poor suggestions for ambiguous multi-topic messages | Low | Low | Keyword matching is a hint, not a gate. Category browsing is the fallback. UX refinement is iterative. | Plan should ensure both auto-suggest and browse-all modes are built. |
| Staff ignore templates and continue writing manually | Low | Medium | Adoption is a UX/habit issue, not a technical one. Making templates prominent and one-click is the mitigation. | Plan should ensure templates are visually prominent, not hidden behind an expand action. |

## Planning Readiness
- Status: Go
- Rationale: The chosen approach (static TS module) is simple, well-scoped, and builds on existing infrastructure (`templateUsed` plumbing, DraftReviewPanel structure, answerComposer data). All architectural questions are answered. No blocking dependencies. Three open questions for operator input are non-blocking (they affect UX details, not architecture). The engineering coverage comparison shows Option A is superior or equivalent on every dimension for v1 scope.
