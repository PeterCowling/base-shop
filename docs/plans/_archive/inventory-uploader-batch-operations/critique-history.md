---
Type: Critique-History
Feature-Slug: inventory-uploader-batch-operations
Stage: fact-find
Created: 2026-03-13
---

# Critique History — inventory-uploader-batch-operations Fact-Find

## Round 1 — Self-critique (2026-03-13)

**Lens applied:** fact-find-lens (evidence quality, open questions, scope signal)

### Critique findings

**Finding 1 — API schema gap originally over-estimated (resolved)**
- Initial assumption was that schema changes would be required to support multi-item payloads.
- Evidence review showed `items: z.array(...).min(1)` with no upper bound already exists in both `stockAdjustmentRequestSchema` and `stockInflowRequestSchema`.
- Resolution: fact-find correctly identifies this as zero back-end work required. Confidence raised.

**Finding 2 — Import route relevance required explicit ruling**
- The dispatch listed the import route as a location anchor. Without investigation, it would be easy to propose reusing it for batch adjustments.
- Evidence review showed the import route does full catalogue replacement (absolute quantities), not additive delta events. Reuse would break the audit trail and require significant schema changes.
- Resolution: fact-find explicitly rules out import route reuse. Option B (CSV) is documented but not recommended, with evidence.

**Finding 3 — Test coverage gap is real and must be in plan**
- Zero tests exist for the form components, the API routes (adjustments/inflows), and the multi-item repository paths. The only existing tests are for auth/session/rate-limit modules.
- Resolution: rehearsal trace flags this; planning constraints note it; suggested task seeds include explicit test tasks (TASK-04, TASK-05). Plan must not skip this.

**Finding 4 — Two open questions remain but defaults are defensible**
- Preview (dry-run) for batch inflows: default is to add preview, mirroring adjustment UX. Low risk.
- Per-row vs shared reason: default is per-row, matching schema semantics. Low risk.
- Resolution: defaults allow planning to proceed without blocking. Both questions are documented for operator input at plan review time.

**Finding 5 — SKU volume evidence is thin (from dev data only)**
- Observed max is 12 SKUs (cochlearfit). The dispatch mentions "dozens of items" which implies 20–50 range.
- Resolution: the form approach is still the right choice even at 50 items. The assumption is documented. If actual volume were 100+, a CSV approach would be revisited.

### Critique verdict

**Pass.** Evidence is sufficient to proceed to analysis. No blocking gaps. All open questions have defensible defaults.

**lp-score: 4.2 / 5.0** — Strong evidence base, zero back-end changes required, clear approach comparison, defensible defaults for open questions. Critical issues: 0.

---

## Plan Critique — Round 1 (codemoot route, 2026-03-13)

- **Artifact:** `docs/plans/inventory-uploader-batch-operations/plan.md`
- **Score:** 7/10 → lp_score 3.5 (`partially credible`)
- **Verdict:** needs_revision
- **Severity counts:** Critical: 1, Major: 2, Minor: 0
- **Findings:**
  - CRITICAL: Result/preview panels used bare `sku` as React key — duplicate key failure for multi-variant same-base-SKU batches. Plan's claim that result panels "already work" for multi-item was false for this case. Both `AdjResult`/`InflowResult` types also dropped `variantAttributes`, leaving variants visually ambiguous.
  - WARNING: TASK-03 test seam location was marked "uncertain" but `packages/platform-core/src/repositories/__tests__/stockInflows.server.test.ts` already exists with the JSON-backend + tmpdir pattern.
  - WARNING: Overall acceptance criteria lacked `@acme/platform-core` validation gate (TASK-03 adds test files there).
- **Autofix applied:**
  - Updated Fact-Find Support section with explicit variant-key gap note and resolution.
  - Updated TASK-01 and TASK-02 execution plans, engineering coverage, and data/contracts to require composite React keys AND variant-aware display text (type updates for `AdjResult`/`InflowResult`/`PreviewState`).
  - Resolved TASK-03 test seam uncertainty; raised TASK-03 confidence from 80% → 85%.
  - Added `pnpm --filter @acme/platform-core build` + lint to acceptance criteria (overall + TASK-03).
  - Updated Rehearsal Trace to document Critical finding as resolved.

## Plan Critique — Round 2 (codemoot route, 2026-03-13)

- **Artifact:** `docs/plans/inventory-uploader-batch-operations/plan.md`
- **Score:** 8/10 → lp_score 4.0 (`credible`)
- **Verdict:** needs_revision (Warnings only — score is credible)
- **Severity counts:** Critical: 0, Major: 2 (Warnings), Minor: 1 (Info)
- **Findings:**
  - WARNING: Variant-handling fix incomplete — plan fixed React keys but execution contract did not yet explicitly require updating `AdjResult.report.items` type to include `variantAttributes`, nor updating display text to show variant suffix.
  - WARNING: `pnpm --filter @acme/platform-core typecheck` is not a valid script — platform-core has no `typecheck` script; `build` runs `tsc -b`.
  - INFO: TASK-03 test seam fix acknowledged as materially stronger.
- **Autofix applied:**
  - TASK-01 and TASK-02 Green execution plans: explicitly require updating local `AdjResult`/`InflowResult`/`PreviewState` types to include `variantAttributes: Record<string,string>` + variant-aware display text.
  - Replaced all `pnpm --filter @acme/platform-core typecheck` references with `pnpm --filter @acme/platform-core build`.
- **Round 3:** Not triggered — no Critical findings remain after Round 2.

## Plan Critique — Final Verdict

- **Rounds run:** 2
- **Final lp_score:** 4.0 (`credible`)
- **Auto-build eligible:** Yes — score ≥ 4.0, no Criticals, at least one IMPLEMENT task at confidence ≥ 80, plan Status: Active.
