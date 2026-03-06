---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Last-reviewed: 2026-03-06
Relates-to: docs/business-os/business-os-charter.md
Feature-Slug: reception-app-native-inbox
Business: BRIK
Priority: P3
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-app-native-inbox/plan.md
Dispatch-ID: IDEA-DISPATCH-20260306153703-0994
---

# Reception App-Native Inbox Fact-Find Brief

## Scope
### Summary
Brikette currently handles guest email through Gmail-backed MCP tooling plus a few narrow reception routes, but there is no app-native inbox inside reception. This fact-find defines the planning baseline for a draft-first reception inbox that keeps Gmail as transport only, admits only actionable emails into the app, and fits the current low-volume/low-cost operating model.

### Goals
- Define the minimum v1 scope for an app-native inbox inside `apps/reception`.
- Identify the current architecture constraints that make a hosted inbox different from the existing local CLI/MCP workflow.
- Determine the safest canonical state model for thread status, draft approval, and send history.
- Confirm the lowest-complexity sync model that fits Brikette's low email volume and closed-season periods.
- Bound what the first release should exclude so the project does not turn into a Gmail clone.

### Non-goals
- Rebuilding all Gmail features inside reception.
- Supporting attachments in v1.
- Implementing real-time push sync or Google admin-dependent infrastructure in v1.
- Replacing Gmail as the sending mailbox/provider.
- Designing a multi-business generic help desk product in this cycle.

### Constraints & Assumptions
- Constraints:
  - Email volume is usually below 100 messages per month during the open season and far lower during the five closed months.
  - Replies must be draft-first: draft, review/edit, approve, then send.
  - Emails that clearly need no response should be filtered out before they enter the working inbox.
  - No attachment handling is required in v1.
  - No Google admin access is available, so any design depending on Gmail push + Cloud Pub/Sub admin setup is out of scope.
- Assumptions:
  - A simple polling/manual refresh model is operationally sufficient for the current volume.
  - D1 is the best fit for canonical inbox state; KV is not appropriate as the primary thread store. Note: reception currently uses Firebase RTDB, not D1, so D1 binding/migration work is new for this app, but there is repo precedent for Cloudflare D1 binding access in `apps/business-os/src/lib/d1.server.ts` and `packages/platform-core/src/d1/getBindings.server.ts`.
  - Gmail labels can remain as mirrored compatibility markers, but should not remain the source of truth once the hosted inbox exists.
  - V1 admission should start from the existing deterministic classifier pattern in `packages/mcp-server/src/tools/gmail-classify.ts`; LLM-assisted classification, if ever added, should be a later optimization rather than a build prerequisite.

## Outcome Contract
- **Why:** The current Brikette email workflow is split between Gmail labels, local MCP tooling, and narrow reception-side draft routes. That is workable for ad hoc operator use, but it is not a clean staff-facing inbox. Because volume is low and the workflow is explicitly draft-first, there is now a realistic path to replace Gmail as the day-to-day UI without paying for an external help desk product, provided the hosted design avoids the current local-filesystem Gmail/auth assumptions.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready architecture exists for a reception-native inbox that admits only actionable emails, stores thread state in app-native records, supports draft-review-send flow through Gmail backend delivery, and fits the current Cloudflare-hosted setup without requiring attachments or Google admin features.
- **Source:** operator

## Access Declarations
- Public vendor docs, read-only:
  - Cloudflare developer pricing/docs for Workers, D1, Durable Objects.
  - Google Gmail API docs for quota and push-notification constraints.
- Repo-local source code, read-only:
  - `apps/reception/**`
  - `packages/mcp-server/**`
  - `docs/plans/reception-guest-email-cutover-fact-find.md`
  - `packages/mcp-server/docs/email-autodraft-system.md`

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/app/api/mcp/guest-email-activity/route.ts` - current hosted reception route that delegates activity-driven guest drafts to the mcp-server helper.
- `apps/reception/src/services/useEmailGuest.ts` - client-side reception service for creating guest drafts through the hosted route.
- `packages/mcp-server/src/tools/gmail.ts` - current Gmail queue/label workflow, lifecycle labels, and audit/telemetry behavior.
- `packages/mcp-server/src/clients/gmail.ts` - Gmail client auth path used by the current mcp-server tooling.
- `apps/reception/wrangler.toml` - reception deploy target and Cloudflare Worker runtime shape.

### Key Modules / Files
- `apps/reception/wrangler.toml`
  - Reception is deployed as a Cloudflare Worker with OpenNext output.
- `apps/reception/src/app/api/mcp/_shared/staff-auth.ts`
  - Hosted reception routes already authenticate staff through Firebase bearer-token verification.
- `apps/reception/src/services/useEmailGuest.ts`
  - Reception currently creates only narrow activity-driven drafts; there is no inbox/thread abstraction.
- `packages/mcp-server/src/tools/gmail.ts`
  - The existing Brikette workflow is centered on Gmail labels such as `Brikette/Queue/Needs-Processing`, `In-Progress`, `Ready-For-Review`, and `Sent`.
- `packages/mcp-server/src/tools/gmail-classify.ts`
  - The current inbox-organize path already has a deterministic classifier with outcomes including `needs_processing`, `promotional`, `spam`, `deferred`, and `trash`.
- `packages/mcp-server/src/tools/gmail-shared.ts`
  - Queue telemetry, locks, and audit behavior are file-backed and local-process oriented.
- `packages/mcp-server/src/clients/gmail.ts`
  - Gmail auth currently depends on `credentials.json` and `token.json` stored on the local filesystem.
- `apps/business-os/src/lib/d1.server.ts`
  - The repo already uses an OpenNext/Cloudflare D1 binding access pattern in another app.
- `packages/platform-core/src/d1/getBindings.server.ts`
  - Shared helper patterns exist for extracting D1 bindings from the Cloudflare runtime environment.
- `packages/mcp-server/docs/email-autodraft-system.md`
  - Documents the current Gmail label lifecycle and the split between inquiry drafting and guest activity draft helpers.
- `docs/plans/reception-guest-email-cutover-fact-find.md`
  - Confirms reception email routing today is draft-first and activity-trigger oriented, not inbox-native.

### Patterns & Conventions Observed
- Gmail labels are currently the primary queue-state mechanism for Brikette email processing.
  - Evidence: `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/docs/email-autodraft-system.md`
- The repo already has a deterministic email classifier for organizing Gmail into `needs_processing`, `promotional`, `spam`, `deferred`, and `trash`, so v1 admission does not need an LLM-first design.
  - Evidence: `packages/mcp-server/src/tools/gmail-classify.ts`
- Reception already has hosted authenticated routes for narrow email actions, so a hosted inbox surface fits the app's current security boundary.
  - Evidence: `apps/reception/src/app/api/mcp/_shared/staff-auth.ts`, `apps/reception/src/app/api/mcp/guest-email-activity/route.ts`
- The existing Gmail tooling assumes a local Node/runtime filesystem for OAuth tokens, audit logs, and lock persistence.
  - Evidence: `packages/mcp-server/src/clients/gmail.ts`, `packages/mcp-server/src/tools/gmail-shared.ts`
- The repo already has a Cloudflare D1 binding pattern, but not in reception, so D1 is a precedent-backed choice rather than a proven reception-local one.
  - Evidence: `apps/business-os/src/lib/d1.server.ts`, `packages/platform-core/src/d1/getBindings.server.ts`
- The current workflow is deliberately draft-first rather than auto-send.
  - Evidence: `docs/plans/reception-guest-email-cutover-plan.md`, operator constraints in this session

### Data & Contracts
- Current operational statuses are represented indirectly through Gmail labels, not app-native records.
- Reception-side email route auth already uses Firebase identity lookup plus RTDB role resolution.
- Current guest-email routing payloads are bounded and code-aware (`bookingRef`, `activityCode`, recipients), but there is no general thread/message schema in reception.
- No D1-backed inbox schema exists today.
- The current deterministic Gmail classifier provides a usable baseline mapping for hosted inbox admission:
  - `needs_processing` -> admit to working inbox
  - `promotional`, `spam`, `trash` -> exclude from working inbox / auto-archive
  - `deferred` -> review-later bucket
  - `booking_reservation`, `cancellation` -> keep out of the human inbox unless v1 explicitly decides to surface them as linked operational events

### Dependency & Impact Map
- Upstream dependencies:
  - Gmail API for thread/message read, draft creation, and send operations.
  - Firebase auth/user-profile lookup for staff authorization inside reception.
  - Cloudflare Worker runtime for hosted reception APIs/UI.
- Downstream dependents:
  - Reception UI and staff workflow.
  - Existing mcp-server Gmail tooling, if parts are reused or mirrored.
  - Any future audit/reporting workflow relying on message state and send history.
- Likely blast radius:
  - `apps/reception` API routes, UI, and persistence layer.
  - A new hosted Gmail adapter layer or a substantial refactor of current mcp-server Gmail usage assumptions.
  - New D1 schema/migrations and operational telemetry.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Low-volume polling is sufficient for Brikette's hosted inbox v1. | Current volume remains low and there is no operator need for second-by-second sync. | Low | Short |
| H2 | D1-backed thread/message state will be operationally simpler than continuing to use Gmail labels as the canonical queue. | Hosted inbox requires filtering, approvals, and audit history not modeled cleanly in labels. | Medium | Short |
| H3 | A deterministic admission filter, starting from the existing Gmail classifier, can keep obvious spam and no-response mail out of the working inbox with acceptable false-positive risk. | Existing classifier quality, Brikette-specific rule additions, and a small review bucket for ambiguous cases. | Medium | Short |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Operator confirmed sub-100 email volume and long closed periods | session input | High |
| H2 | Current system stores lifecycle in Gmail labels and local JSONL/lock files | repo code/docs | High |
| H3 | Existing Gmail classify flow already distinguishes `needs_processing`, `promotional`, `spam`, `deferred`, and `trash` deterministically | `packages/mcp-server/src/tools/gmail-classify.ts` | High |

#### Recommended Validation Approach
- Quick probes:
  - Model the inbox around polling/manual refresh rather than push.
  - Spike a D1 schema for threads, messages, events, drafts, and admissions.
  - Spike a hosted Gmail adapter that stores OAuth refresh credentials outside the local filesystem and can create/send drafts from a Worker-hosted route.
- Structured tests:
  - Replay a labeled sample of recent Brikette email metadata/snippets through the deterministic classifier and measure false-admit / false-exclude rates.
  - Admission classifier fixtures for actionable vs spam vs no-response vs ambiguous review-later cases.
  - Route/service contract tests for draft approval and send transitions.
- Deferred validation:
  - Real-time push sync and advanced multi-user arbitration.

### Test Landscape
#### Test Infrastructure
- Reception: Jest + typecheck + lint.
- MCP server: Jest + typecheck + lint.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Reception guest draft route | Unit/contract | `apps/reception/src/services/__tests__/useEmailGuest.test.tsx` | Confirms route-driven guest drafting, not inbox behavior |
| Reception booking draft route | Unit/contract | `apps/reception/src/services/__tests__/useBookingEmail.test.ts` | Confirms hosted route pattern already exists |
| Gmail queue tools | Unit | `packages/mcp-server/src/__tests__/gmail-list-pending.test.ts`, `gmail-get-email.test.ts`, `gmail-create-draft.test.ts`, others | Strong coverage for current Gmail-label workflow |
| Guest activity drafts | Unit | `packages/mcp-server/src/__tests__/guest-email-activity.test.ts` | Covers activity-based template draft creation |

#### Coverage Gaps
- No hosted inbox thread/message schema tests exist.
- No D1-backed inbox persistence exists.
- No tests for an admission gate that excludes spam/no-response mail before inbox admission.
- No tests for draft approval/send lifecycle inside reception UI.

#### Testability Assessment
- Easy to test:
  - Admission gate rules and classifier replay fixtures.
  - D1 repository layer.
  - Route transitions (`pending -> drafted -> approved -> sent -> resolved`).
- Hard to test:
  - Perfect Gmail thread parity across all message edge cases.
  - Production-like sync behavior if Gmail remains the system of record for raw message data.
  - Hosted OAuth refresh and token-rotation behavior in the Worker runtime without a production-like secret store.

### Recent Git History (Targeted)
- `docs/plans/reception-guest-email-cutover-plan.md`
  - Recent work moved reception guest email toward hosted routes and mcp-server helpers, but stopped short of building an inbox.
- `docs/plans/email-day-to-day-readiness/plan.md`
  - Current investment focus remains Gmail drafting reliability, not reception-native inbox architecture.

## External Research (If Needed)
- Official Cloudflare docs confirm the reception hosting path is compatible with Workers/OpenNext, and D1 is available as part of the Workers platform. For Brikette's low volume, a D1-backed inbox is operationally plausible without adding another SaaS dependency.
  - Source: https://developers.cloudflare.com/workers/platform/pricing/
  - Source: https://developers.cloudflare.com/d1/platform/pricing/
- Official Gmail docs confirm push-notification designs depend on Gmail watch semantics and Cloud Pub/Sub setup. Given the operator constraint of no Google admin access, that makes push an unnecessary v1 dependency.
  - Source: https://developers.google.com/gmail/api/guides/push
  - Source: https://developers.google.com/workspace/gmail/api/reference/quota

## Questions
### Resolved
- Q: Is a high-frequency or real-time sync architecture required?
  - A: No. The operator confirmed volume is usually under 100 emails and drops sharply during the closed season, which makes polling/manual refresh viable for v1.
- Q: Must attachments be supported?
  - A: No. Attachments are explicitly out of scope for v1.
- Q: Can the system auto-send drafts?
  - A: No. The workflow must remain draft-first with explicit user approval before send.
- Q: Should spam and no-response emails enter the working inbox?
  - A: No. The system should use an admission gate so only actionable mail enters the app inbox; obvious spam, promotional mail, system notifications, and no-response guest replies should be excluded or shunted to a low-volume review path.
- Q: Can v1 rely on Gmail push / Google admin features?
  - A: No. No Google admin access is available, so the planning baseline should exclude push-dependent architectures.
- Q: Should v1 use LLM-assisted routing as the primary admission mechanism?
  - A: No. V1 should start from the existing deterministic classifier in `packages/mcp-server/src/tools/gmail-classify.ts`, then add a small review bucket for ambiguous cases. LLM-assisted routing is a later optimization, not a prerequisite.
- Q: Why not keep extending the current Gmail/MCP CLI workflow instead of building a hosted inbox?
  - A: Because the operator requirement is explicit: the reception app should become the day-to-day inbox while Gmail remains backend only. Improving the CLI path alone would not satisfy that outcome.

### Open (Operator Input Required)
None. The operator constraints needed to classify feasibility and scope are already resolved.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Reception hosted runtime/auth boundary | Yes | None | No |
| Current Gmail queue/state architecture | Yes | Label-based queue state creates source-of-truth drift risk for hosted inbox | Yes |
| Gmail auth/audit/lock assumptions | Yes | Current implementation is local-filesystem oriented, not hosted-inbox ready; hosted refresh-token storage/rotation remains the main spike | Yes |
| Volume/cost feasibility | Yes | Low-volume design is viable, but exact v1 scope must stay constrained | No |
| Inbox-admission requirement | Yes | False positives/negatives remain a product risk even with the existing deterministic classifier | Yes |

## Scope Signal
- **Signal:** right-sized
- **Rationale:** The work is materially larger than a single route refactor, but it is still bounded if planning is constrained to a draft-first, low-volume, no-attachments, no-push v1. The key risk is not missing context; it is over-scoping into Gmail parity.

## Confidence Inputs
- Implementation: 72%
  - Evidence basis: the current architecture (hosting, runtime, auth boundaries, email routes) is well traced. However, two unresolved infrastructure decisions — hosted Gmail OAuth token storage/refresh in a Worker environment and adding D1 to a reception app that currently uses only Firebase RTDB — represent real implementation unknowns, not detail work.
  - To raise to >=90: spike hosted OAuth token refresh from a Worker; confirm D1 migration path alongside existing Firebase RTDB usage.
- Approach: 82%
  - Evidence basis: operator constraints remove the hardest optional features (attachments, auto-send, push, admin setup), making D1 + polling + draft approval the strongest fit. The competing alternative of "just improve the MCP CLI" is now explicitly rejected because it fails the operator requirement that Gmail be backend only, but hosted Gmail adapter design is still unproven.
  - To raise to >=90: capture exact send/draft review UI states desired by staff; prove a hosted Gmail adapter shape that works inside reception.
- Impact: 80%
  - Evidence basis: replacing Gmail UI for daily handling would improve operational clarity, but only if source-of-truth and admission filtering are designed correctly. No evidence exists that staff find Gmail inadequate for current daily email — the case rests on "cleaner" rather than "fixing a failure."
  - To raise to >=90: confirm staff willingness to work from reception instead of Gmail; identify specific Gmail pain points that the hosted inbox resolves.
- Delivery-Readiness: 70%
  - Evidence basis: enough evidence exists to plan, but the build still requires one explicit architectural decision early: hosted Gmail adapter shape (OAuth token storage, refresh mechanism). Admission gating is no longer a major design unknown because a deterministic baseline already exists in the repo.
  - To raise to >=90: produce a schema-level architecture sketch; spike hosted OAuth options before build starts.
- Testability: 86%
  - Evidence basis: route/state/admission logic is testable, and the existing deterministic classifier makes admission behavior straightforward to replay against labeled samples. Gmail parity and hosted auth remain the harder seams.
  - To raise to >=90: define clear contract tests for sync checkpoints and send transitions; prove a Worker-safe token refresh path.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Hosted inbox reuses current local Gmail/token/audit assumptions and stalls | Medium | High | Treat hosted Gmail integration as a separate architecture decision, not a direct lift of the current CLI path |
| App-native state drifts from Gmail label state | High | High | Make D1/app records canonical; mirror Gmail labels only as secondary output |
| Project scope expands into Gmail-clone parity | Medium | High | Freeze v1 around queue, thread view, draft approval, send, resolve |
| Admission filter hides valid mail or admits junk | Medium | Medium | Use `admit`, `auto-archive`, `review-later` outcomes with explicit auditability |
| Privacy/retention obligations grow once message data is stored in app state | Medium | High | Plan retention, access control, and audit logging up front |
| Staff ignore hosted inbox and continue using Gmail for daily email | Medium | High | Identify specific Gmail pain points; roll out as parallel surface with clear advantages over Gmail before hard cutover |

## Planning Constraints & Notes
- Must-follow patterns:
  - App-native state must become canonical for workflow status.
  - Draft approval is mandatory before send.
  - Only actionable mail should enter the working inbox.
  - D1 is the preferred canonical store; avoid KV for core inbox state.
- Hosted Gmail adapter options:
  - Option A: reuse the current `credentials.json` / `token.json` local-auth pattern inside reception. Reject. It depends on local filesystem state and interactive local auth.
  - Option B: build a reception-hosted Gmail adapter that uses app-managed secret/token storage and refresh flow from Worker routes. Viable baseline, but requires an implementation spike because the repo does not yet have this pattern.
  - Option C: add a separate Node relay service just for Gmail auth/send/sync. Technically viable, but it adds infrastructure and undermines the low-cost/low-complexity goal.
  - Preferred planning baseline: Option B.
- Rollout/rollback expectations:
  - Roll out as a parallel reception surface before any hard cutover from Gmail habits.
  - Rollback path should preserve Gmail as the transport/source for raw messages.

## Planning Readiness
- **Decision posture:** ready for `/lp-do-plan`, with one explicit early-spike requirement.
- **What is planning-ready now:**
  - v1 scope is bounded: draft-first, low-volume, no attachments, no push, Gmail backend only.
  - Canonical state direction is clear: app-native records in D1, not Gmail labels.
  - Admission direction is clear: deterministic classifier baseline with review-later escape hatch.
- **What must become a first plan task, not a hidden assumption:**
  - Prove a hosted Gmail adapter/token-refresh design that works in the reception Worker runtime without local filesystem state.
- **Stop condition for build:** if the hosted Gmail auth spike cannot produce a reliable Worker-safe draft/create/send flow, the feature should not proceed past planning into full implementation.
- Observability expectations:
  - Every admission, state change, approval, send, and resolution event should be auditable in-app.
  - Mirror enough metadata back to Gmail to preserve operational fallback if needed.

## Suggested Task Seeds (Non-binding)
- TASK-S1: Define the canonical inbox domain model (`threads`, `messages`, `thread_events`, `drafts`, `assignments`, `admission_outcomes`).
- TASK-S2: Decide the hosted Gmail adapter/auth model for reception.
- TASK-S3: Design the admission gate for actionable vs spam/no-response mail.
- TASK-S4: Build the reception thread list + thread detail + draft approval UI contract.
- TASK-S5: Define polling/manual refresh sync checkpoints and fallback behavior.
- TASK-S6: Define telemetry, retention, and audit requirements for stored message/workflow state.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - A v1 architecture with canonical state model, hosted Gmail adapter boundary, admission gate, and draft approval/send lifecycle
  - Explicit non-goal list that keeps attachments, push sync, and Gmail parity out of v1
  - Scoped validation plan for route contracts, D1 repositories, and admission logic
- Post-delivery measurement plan:
  - Track admitted vs auto-archived vs review-later thread counts
  - Track draft approval/edit/send cycle time
  - Track fallback-to-Gmail incidents during rollout

## Evidence Gap Review
### Gaps Addressed
- Confirmed hosted reception boundary and auth pattern from repo code.
- Confirmed current Gmail queue state is label-driven and local-process oriented.
- Confirmed user constraints needed to bound the architecture and feasibility.
- Confirmed official vendor-doc constraints relevant to hosting and push sync.

### Confidence Adjustments
- Implementation (72%) and Delivery-Readiness (70%) are below 80% because hosted Gmail OAuth and D1 integration in reception are unresolved infrastructure decisions, not implementation details.
- Approach (82%) is below 90% because the hosted Gmail adapter design is still unproven even though the MCP-CLI-only alternative has now been explicitly rejected.
- Impact (80%) is below 90% because no evidence exists that staff find Gmail inadequate — the case rests on operational improvement, not fixing a failure.

### Remaining Assumptions
- A hosted Gmail adapter can be implemented cleanly enough to avoid keeping the current local token-file pattern.
- Staff workflow can live comfortably with polling/manual refresh rather than real-time push.
- A lightweight review bucket is acceptable for borderline admission cases.
- Staff will adopt the reception inbox over Gmail for daily email handling despite Gmail's search, mobile access, and familiarity advantages.
