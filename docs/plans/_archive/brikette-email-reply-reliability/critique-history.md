# Critique History: brikette-email-reply-reliability

## Round 1 — 2026-03-12

**Target:** `docs/plans/brikette-email-reply-reliability/fact-find.md`
**Schema mode:** Current (Fact-Find)
**Overall score:** 4.0 (credible)
**Severity distribution:** Critical: 0 | Major: 1 | Moderate: 3 | Minor: 2

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Scope § Problem 2 | Fix ordering constraint absent: current code writes `gmailDraftId` to D1 after `sendGmailDraft()` — the required ordering inversion (write-before-send) was not stated, making the TASK-02 seed under-specified for implementation |
| 1-02 | Moderate | Evidence Audit § Remaining Assumptions | Inbox UI rendering of `needs_manual_draft` left as an unstated assumption rather than an open question — blocks TASK-01 scoping |
| 1-03 | Moderate | Evidence Audit § Data & Contracts | `quality_json` no-migration path for `deliveryStatus` not noted — analysis would have to re-discover this; low-cost path omitted |
| 1-04 | Moderate | Risks table | Gmail `users.drafts.send` re-send idempotency risk absent — a retry that calls `sendGmailDraft(id)` on an already-consumed draft ID has undefined Gmail API behaviour |
| 1-05 | Minor | Scope § Constraints & Assumptions | Inbox UI `needs_manual_draft` rendering assumed without evidence; acknowledged but left in the assumptions list rather than elevated |
| 1-06 | Minor | Suggested Task Seeds § TASK-02 | Seed omits explicit D1-write-before-send step, reducing implementation specificity |

### Issues Confirmed Resolved This Round

None (first round).

### Issues Carried Open (not yet resolved)

None (first round).

### Autofix Summary

Applied 5 fixes to `fact-find.md`:
1. Problem 2 description in `## Scope`: added explicit ordering constraint (write `gmailDraftId` to D1 before `sendGmailDraft()`) — closes 1-01
2. TASK-02 seed in `## Suggested Task Seeds`: added explicit ordering steps (1–4) — closes 1-06
3. `## Evidence Audit § Remaining Assumptions`: moved inbox UI `needs_manual_draft` rendering assumption to a new `### Open Questions (Evidence Gaps)` subsection — closes 1-02 and 1-05
4. `## Evidence Audit § Data & Contracts`: added note that `quality_json` carries `deliveryStatus` without a D1 migration — closes 1-03
5. `## Risks` table: added Gmail send idempotency risk row — closes 1-04

---

## Round 2 — 2026-03-12

**Target:** `docs/plans/brikette-email-reply-reliability/analysis.md`
**Schema mode:** Current (Analysis)
**Header/Structure override:** No
**Mode evidence:** Decision Frame, Evaluation Criteria, Options Considered, Chosen Approach, Planning Handoff — all present and substantive.

**Executive Verdict:** The document is **credible**. All three root causes are evidenced from source code (not inferred). Option comparisons are materially different. Recommendation is decisive per problem. Sequencing constraint is explicit and well-reasoned. No D1 migration claim is supported by fact-find evidence. One post-analysis code discovery (existing `manualDraftCount` badge in `InboxWorkspace.tsx:18-22`) was applied as an autofix, reducing Problem 1 UI scope.

**Recommended action:** proceed to planning

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | End-State Operating Model / UI row | Initial draft stated Problem 1 navigation badge as new work; post-analysis code read of `InboxWorkspace.tsx:18-22` shows badge already exists. Applied autofix: row updated to reflect no new UI work for P1. |
| 2-02 | Moderate | Planning Readiness | Post-analysis discovery not surfaced in initial draft. Applied autofix: note added to Planning Readiness and Engineering Coverage Comparison UI row. |
| 2-03 | Minor | Rejected Options | Section uses `## Rejected Options` header instead of `### Rejected Approaches` as per template. No decision impact; validators pass. Not autofixed. |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-02 | Moderate | Inbox UI `needs_manual_draft` rendering left unstated | Code read of `InboxWorkspace.tsx` confirmed badge exists; analysis notes this explicitly |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 2-03 | Minor | 1 | `## Rejected Options` vs `### Rejected Approaches` template naming drift — no decision impact |

### Scorecard

| Dimension | Score | Justification |
|---|---|---|
| Evidence quality | 4.5 | Top 3 claims verified against source files; post-analysis code discovery added. |
| Coherence | 4.5 | Options materially different; recommendation per problem decisive; sequencing rationale explicit. |
| Completeness (decision-grade) | 4.5 | All required sections present and substantive; post-analysis discovery applied as autofix. |
| Feasibility | 4.5 | Code-only changes; existing D1/Jest/mock-injection patterns used throughout. |
| Measurability | 4.0 | Three new telemetry event types named with concrete field names. |
| Risk handling | 4.0 | Badge query performance, orphaned draft, cron limit, alerting modality — all named with mitigations. |

**Weighted overall: 4.5**
(0.25×4.5 + 0.20×4.5 + 0.15×4.5 + 0.15×4.5 + 0.10×4.0 + 0.15×4.0 = 4.375, rounded to 4.5)

**Severity distribution:** 0 Critical, 0 Major, 2 Moderate (autofixed), 1 Minor (carried open)

**Autofix summary:** 3 edits applied (End-State Operating Model UI row, Engineering Coverage Comparison UI row, Planning Readiness post-analysis note). No section rewrites triggered. Consistency scan: no duplicate definitions, no orphaned terminology. Issues ledger appended.

---

## Round 3 — 2026-03-12

**Target:** `docs/plans/brikette-email-reply-reliability/plan.md`
**Schema mode:** Current (Plan)
**Header/Structure override:** No
**Mode evidence:** `## Summary`, `## Task Summary`, `## Tasks`, `## Risks & Mitigations` all present and substantive.

**Executive Verdict:** The document is **credible**. All three load-bearing claims verified against source code. Task boundaries are clean. Consumer tracing for `deliveryStatus` is explicit. Sequencing rationale sound. Two Moderate issues autofixed (serialization wording, UI component path acknowledgment).

**Recommended action:** proceed

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Moderate | TASK-03 Execution plan step 3 | Text implied `InboxDraftApiModel` needed a type annotation change; `quality` is already `Record<string, unknown> | null` — no type change needed. Autofixed: wording clarified to state no serialization function change required. |
| 3-02 | Moderate | TASK-03 Execution plan step 5 | UI component file path not identified in the plan; deferred to build without explicit acknowledgment. Autofixed: "likely within ThreadDetailPane.tsx" added to execution plan step. |
| 3-03 | Minor | TASK-03 Execution plan step 1 vs Unexpected Findings | Step 1 wording "captured from draftResult in processThread" is slightly less precise than Unexpected Findings which says "merge deliveryStatus when assembling draftPayload". Carried open — no decision impact. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-03 | Minor | `## Rejected Options` vs `### Rejected Approaches` header naming | Not in plan (plan does not have this section); resolved by scope change |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 3-03 | Minor | 1 | TASK-03 execution plan step 1 wording slightly less precise than Unexpected Findings |

### Scorecard
| Dimension | Score | Justification |
|---|---|---|
| Evidence quality | 4.5 | Top 3 load-bearing claims verified against source with line numbers; `updateDraft()` signature confirmed |
| Coherence | 4.5 | Task sequencing rationale explicit; TASK-01 → TASK-02 dependency sound; TASK-03 independence confirmed |
| Completeness (decision-grade) | 4.5 | All required plan sections present; consumer tracing done; Delivered Processes concrete |
| Feasibility | 4.5 | All file paths confirmed; no unknown dependencies; `quality_json` write path traced through both sync and recovery paths |
| Measurability | 4.0 | TC cases cover happy/failure/edge per task; UI component path acknowledged as build-phase confirmation |
| Risk handling | 4.5 | Orphaned draft, D1 double-write non-transactional, quality_json null-default, alerting modality — all addressed |
| **Weighted overall** | **4.5** | 0.25×4.5 + 0.20×4.5 + 0.15×4.5 + 0.15×4.5 + 0.10×4.0 + 0.15×4.5 = 4.45 → 4.5 |

**Severity distribution:** 0 Critical, 0 Major, 2 Moderate (autofixed), 1 Minor (carried open)
No severity caps applied.

**Autofix summary:** 2 point fixes applied (TASK-03 execution plan step 3 wording, TASK-03 execution plan step 5 UI component path). No section rewrites triggered (no named section had ≥2 Major issues). Consistency scan: no duplicate definitions, no orphaned terminology. Issues ledger updated.
