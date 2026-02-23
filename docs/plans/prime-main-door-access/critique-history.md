---
Type: Critique-History
Target: docs/plans/prime-main-door-access/fact-find.md
Critique-Date: 2026-02-21
Critique-Scope: full
Verdict: PASS-WITH-FIXES
Score: 91/100
Autofix-Applied: true
---

# Critique History — prime-main-door-access fact-find

## Run 1 — 2026-02-21

### Step 0 — Document Type Identification

Target type: Fact-Find (Section A lens applies). Execution track: `code`. Confidence dimensions expected: 5 (Implementation, Approach, Impact, Delivery-Readiness, Testability). Full scope critique required.

---

### Step 1 — Frontmatter Completeness

Required fields checked:

| Field | Present | Value | Status |
|---|---|---|---|
| Type | Yes | Fact-Find | Pass |
| Outcome | Yes | Planning | Pass |
| Status | Yes | Ready-for-planning | Pass |
| Domain | Yes | UI | Pass |
| Workstream | Yes | Engineering | Pass |
| Created | Yes | 2026-02-21 | Pass |
| Last-updated | Yes | 2026-02-21 | Pass |
| Feature-Slug | Yes | prime-main-door-access | Pass |
| Deliverable-Type | Yes | code-change | Pass |
| Execution-Track | Yes | code | Pass |
| Primary-Execution-Skill | Yes | lp-do-build | Pass |
| Supporting-Skills | Yes | none | Pass |
| Related-Plan | Yes | docs/plans/prime-main-door-access/plan.md | Pass |
| Business-OS-Integration | Yes | off | Pass |

Additional fields present: `Deliverable-Family`, `Deliverable-Channel`, `Deliverable-Subtype`, `Startup-Deliverable-Alias`, `Business-Unit`, `Card-ID`. All are either valid extended fields or acceptable `none` values.

Frontmatter verdict: **PASS** (all required fields present).

---

### Step 2 — Section Presence and Substantiveness

Required sections for Fact-Find (code track):

| Section | Present | Substantive | Notes |
|---|---|---|---|
| Scope | Yes | Yes | Summary, Goals, Non-goals, Constraints & Assumptions all populated |
| Evidence Audit | Yes | Yes | Entry Points, Key Modules, Patterns, Data & Contracts, Dependency & Impact Map, Security, Delivery, Test Landscape all present |
| Confidence Inputs | Yes | Yes | All 5 dimensions present with percentages and rationale |
| Risks | Yes | Yes | 6 risks with Likelihood / Impact / Mitigation |
| Planning Readiness | Yes | Yes | Blocking items stated, next step recommended |
| Test Landscape | Yes | Yes | Infrastructure, existing coverage, gaps, testability assessment, recommended approach — all populated |
| Questions | Yes | Yes | Resolved and Open questions present; Open questions include Decision owner |
| Suggested Task Seeds | Yes | Yes | 3 task seeds present |
| Execution Routing Packet | Yes | Yes | Deliverable acceptance package defined |
| Evidence Gap Review | Yes | Yes | Gaps addressed, confidence adjustments, remaining assumptions |

Section presence verdict: **PASS**.

---

### Step 3 — Open Questions Quality

Open questions checked:

1. "What are the exact door entry steps to display?" — Decision owner: "Hostel operator / product owner". Default assumption and risk stated. PASS.
2. "Should `enabled` for `useCheckInCode` be `true` always, or only when arrivalState is `arrival-day` or `checked-in`?" — Decision owner: "Engineering / product owner". Default assumption and risk stated. PASS.

Open question quality verdict: **PASS**.

---

### Step 4 — Status Gate Check

Status: `Ready-for-planning`.

Gate requires: no untested load-bearing assumptions.

Assumptions in the document:
- Static inline copy for door instructions → plan-level concern, acknowledged and bounded. PASS (not untested; risk is documented).
- `enabled: true` unconditionally → flagged as open question with default, acknowledged. PASS.
- No i18n required → evidenced by existing comparable pages. PASS.

One concern: the door instruction copy is genuinely unknown. However, the document correctly characterises this as a plan-level concern (content gap), not a fact-find blocker, and the Implementation approach is otherwise fully evidenced. The status `Ready-for-planning` is defensible. PASS.

---

### Step 5 — Confidence Dimensions

5 dimensions present (correct for Fact-Find):

| Dimension | Score | Rationale Present | Raise-To Guidance | Assessment |
|---|---|---|---|---|
| Implementation | 88% | Yes | Yes (confirm door copy) | Calibrated correctly |
| Approach | 85% | Yes | Yes (confirm enabled flag) | Calibrated correctly |
| Impact | 90% | Yes | No raise-to specified | Acceptable — already high |
| Delivery-Readiness | 85% | Yes | Yes (resolve copy before build) | Calibrated correctly |
| Testability | 85% | Yes | Yes (write test file) | Calibrated correctly |

All above 80% threshold required for `Ready-for-planning`. PASS.

Confidence dimensions verdict: **PASS**.

---

### Step 6 — Load-Bearing Claim Verification (Repo Read)

Three top load-bearing claims verified against actual files:

**Claim A: The stub page has no state or data fetching (just DoorOpen icon, h1, placeholder paragraph, Return Home link).**

Verified against `apps/prime/src/app/(guarded)/main-door-access/page.tsx`. Actual file confirmed: `DoorOpen` icon, "Main Door Access" h1, "Door access information." paragraph, Return Home link, no hooks. PASS — exact match.

**Claim B: `useCheckInCode` accepts `{ checkOutDate, autoGenerate?, enabled? }` and returns `{ code, isLoading, isError, errorMessage, isStale, isOffline, generateCode, refetch }`.**

Verified against `apps/prime/src/hooks/useCheckInCode.ts`. Interface definitions at lines 18-44 confirm exact shape. Auto-generate trigger at lines 133-147 confirmed. PASS — exact match.

**Claim C: `GuardedHomeExperience` passes `enabled: arrivalState === 'arrival-day'` to `useCheckInCode`.**

Verified against `apps/prime/src/components/homepage/GuardedHomeExperience.tsx` line 62. PASS — exact match.

**Additional claim verified (D): Email templates T06 and T07 use `{{SLOT:APP_LINK}}` and are `normalization_batch: "A"` with the stated `canonical_reference_url`.**

Verified against `packages/mcp-server/data/email-templates.json` lines 48-64. PASS — exact match. T06 body also confirms quoted door instructions text ("Note, your keycard is only for room access", "The main door is locked overnight for security reasons").

**Additional claim verified (E): Error state pattern in comparable guarded pages.**

Checked `apps/prime/src/app/(guarded)/cash-prep/page.tsx`, `routes/page.tsx`, and `eta/page.tsx`. ALL use `text-danger` (not `text-danger-fg`). **FAIL on the document's claim** — the Planning Constraints section stated `text-danger-fg` which is incorrect.

**AUTOFIX APPLIED (AF-1):** Corrected `text-danger-fg` → `text-danger` in Planning Constraints section.

**Additional claim verified (F): ArrivalHome.tsx offline banner tokens.**

Verified: `bg-warning-soft / text-warning-foreground` for stale warning (line 182), `bg-danger-soft / text-danger-foreground` for offline-no-cache (line 194). PASS — exact match.

---

### Step 7 — Internal Consistency

Cross-checks:

- Status `Ready-for-planning` vs Confidence scores: All 5 dimensions ≥ 85%. Consistent. PASS.
- Constraints say `useCheckInCode` requires `checkOutDate` for auto-generation: confirmed in hook (line 101 guards `!checkOutDate`). Consistent. PASS.
- Non-goal "No new back-end API" vs Implementation: all hooks and CF functions already exist. Consistent. PASS.
- Test Landscape says no test file exists for `main-door-access`: confirmed by filesystem check (`__tests__` directory does not exist under `(guarded)/main-door-access`). Consistent. PASS.
- Claim that `useCheckInCode` and `useUnifiedBookingData` are mockable in existing tests: verified by grep — both are mocked in `arrival.test.tsx` and `home.test.tsx`. Consistent. PASS.

Internal consistency verdict: **PASS**.

---

### Step 8 — Boundary Coverage

Auth boundary: `GuardedGate` reviewed; no uuid forwarding at layout level confirmed (layout reads `isAuthenticated` only). Consistent with claim. PASS.

Offline boundary: `codeCache.ts` confirmed. `CachedCode { code, cachedAt }` — no expiry enforcement on read confirmed (no expiry check in `getCachedCheckInCode`). PASS.

API boundary: CF function at `apps/prime/functions/api/check-in-code.ts` referenced; no auth gate noted; document describes this as "intentional by design". PASS.

DS token lint gate: `apps/prime` uses DS tokens. Error state token correction applied (see Step 6). PASS after fix.

---

### Step 9 — Test Landscape Completeness (Code Track Required)

Test infrastructure identified: Jest + RTL, Playwright present. Commands provided. CI integration noted. PASS.

Coverage matrix: existing tests for `useCheckInCode`, guarded home arrival — listed correctly. No test file for `main-door-access` — gap correctly identified. PASS.

Coverage gaps: 6 gaps enumerated. PASS.

Testability assessment: easy/hard split provided. Test seams identified with evidence (existing mock pattern). PASS.

Recommended approach: unit tests for 5 cases, no integration/E2E/contract required initially. Proportionate to the task size. PASS.

Test Landscape verdict: **PASS**.

---

### Step 10 — Risks Completeness

6 risks present. All have Likelihood, Impact, Mitigation. Risk coverage:

- Door copy incorrect — PRESENT. PASS.
- Pre-arrival guest early access — PRESENT. PASS.
- DS lint gate rejection — PRESENT (and one actual error was caught and fixed). PASS.
- `useUnifiedBookingData` null — PRESENT. PASS.
- Clipboard failure on mobile — PRESENT. PASS.
- No tests added — PRESENT. PASS.

Missing risk consideration: none identified beyond what is already captured. PASS.

---

### Step 11 — Planning Readiness Section

Blocking items: "None hard-blocking" — correct given evidence. Copy gap is plan-level not fact-find-level. PASS.

Next step: `/lp-do-plan` — correct skill. PASS.

Rollout/rollback: zero risk noted, justified (stub is self-contained, no downstream imports). PASS.

---

### Autofix Phase Summary

**AF-1 (Concrete error fix):** In the Planning Constraints section, corrected the error state class from `text-danger-fg` to `text-danger`. This was verified against three real pages (`cash-prep`, `routes`, `eta`) which all use `text-danger`. The erroneous token `text-danger-fg` does not exist in the design system token set and would have caused a DS lint failure during implementation.

**AF-2 (No further structural additions required):** All sections present and substantive. No section stubs found.

**AF-3 (No frontmatter updates required):** All required fields present. `Last-updated` is current (2026-02-21).

**AF-4 (No confidence recalibration required):** Scores are appropriate. The `text-danger-fg` error was in the Planning Constraints guidance only, not in the Implementation or Approach confidence rationale, so no confidence score change is warranted.

---

### Final Verdict

**PASS-WITH-FIXES**

**Score: 91/100**

Score breakdown:
- Frontmatter: 10/10
- Section presence/substantiveness: 20/20
- Open questions quality: 8/10 (minor: the `enabled` question default assumption is stated as "low risk" but the hook docstring itself says "pre-arrival or arrival-day" — the assumption that `enabled=true` always is acceptable but could be more precisely scoped to "checked-in or later")
- Claim verification: 17/20 (one concrete error found and fixed: `text-danger-fg` vs `text-danger`)
- Internal consistency: 10/10
- Test Landscape: 10/10
- Risks: 9/10 (minor: no explicit risk for the case where `checkOutDate` is null/undefined when the guest accesses via the email link without prior portal load — the hook silently skips auto-generation in that case)
- Confidence calibration: 7/10 (Impact at 90% could arguably be lower given the copy gap is unknown — but the core functionality gap being addressed is clear and measurable, so 90% is defensible)

**Fixes applied:** 1 concrete correction (`text-danger-fg` → `text-danger` in Planning Constraints).

**Remaining open issues:**
1. Door instruction copy is unresolved — must be a TASK-03 deliverable in the plan. Operator must provide or approve the copy before TASK-01 ships.
2. The `enabled: true` vs `enabled: arrivalState === 'arrival-day'` question remains open. The default assumption is reasonable, but the plan should capture this as a decision to be confirmed by the engineering lead before implementation.
3. Minor: the `checkOutDate` null path when a pre-arrival guest arrives via email link before `useUnifiedBookingData` resolves could produce a brief period where auto-generation is skipped silently. This is worth a `// TODO: handle null checkOutDate loading state` comment in the implementation. Not a blocker.
