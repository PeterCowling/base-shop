---
feature-slug: reception-extension-city-tax-recording
build-date: 2026-03-14
commit: a5d259cb61
status: Complete
---

# Build Record — Reception Extension City Tax Recording

## Outcome Contract

- **Why:** When staff check "Mark city tax as paid" during a booking extension, the payment needs to be recorded in the system. For guests who already paid city tax at check-in (the majority), nothing was being written — cash collected but never recorded, creating a reconciliation gap.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Checking "Mark city tax as paid" during an extension: (a) displays the correct collection amount including any old outstanding balance plus the extension nights' tax; and (b) always creates or updates a city tax record that correctly includes the extension nights' tax amount in `totalDue`, regardless of the guest's prior city tax status.
- **Source:** operator

## Summary

Two bugs in `ExtensionPayModal.tsx` fixed in a single commit:

1. **Display fix** (`displayedCityTaxTotal` useMemo): the city tax amount shown to staff was wrong for guests with an outstanding balance — it showed only the old unpaid amount instead of `old_balance + extension_nights_tax`. Staff were collecting the correct cash but being told to collect too little.

2. **Write fix** (`handleExtend` city tax block): the `saveCityTax` write was guarded by `if (record && record.balance > 0)`, silently skipping all guests who were fully paid up or had no prior record. The fix replaces all conditional branching with a single unconditional formula: `{ totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 }`.

Additionally, `defaultCityTaxPerGuest` was added to the `handleExtend` `useCallback` dependency array (correctness fix).

Four tests updated: render display assertion, case A write shape, case B test flipped to assert writes, new case C test.

## Tasks Completed

| Task | Description | Status |
|---|---|---|
| TASK-01 | Fix `displayedCityTaxTotal` + `handleExtend` in `ExtensionPayModal.tsx` | Complete (2026-03-14) |
| TASK-02 | Update 3 tests + add case C test in `ExtensionPayModal.test.tsx` | Complete (2026-03-14) |

## Engineering Coverage Evidence

- **UI / visual**: `displayedCityTaxTotal` now returns `sum + (record?.balance ?? 0) + defaultCityTaxPerGuest` for every occupant in `cityTaxTargets`. Render test updated: `"5,00"` → `"7,50"` for default single-guest (balance=5 + 2.5 ext).
- **UX / states**: Display and write use the same formula basis. Staff see the correct amount for all 3 guest types.
- **Security / privacy**: N/A — internal staff tool, no PII, no auth changes.
- **Logging / observability / audit**: `ActivityCode.CITY_TAX_PAYMENT` (enum, not literal 9) write attempted for all 3 cases. Previously only attempted for case A. TypeScript enum usage enforced via typecheck.
- **Testing / validation**: 3 existing assertions updated + 1 new case C test. Tests run in CI only (policy: `docs/testing-policy.md`).
- **Data / contracts**: Unified write `{ totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 }` handles all 3 cases via Firebase `update()`. Node created when absent (case C). Downstream reader `pricing-queries.server.ts:114-139` read-only; benefits from `balance: 0` write.
- **Performance / reliability**: Max 2 Firebase writes per occupant (date + city tax). Not on hot path.
- **Rollout / rollback**: Single commit `a5d259cb61`. No migration. Prior city tax records unaffected. Rollback = revert.

Deterministic validator: `scripts/validate-engineering-coverage.sh docs/plans/reception-extension-city-tax-recording/plan.md` → `{ "valid": true }`.

Local validation: `pnpm --filter @apps/reception typecheck && lint` → 0 errors, pre-existing warnings only (unrelated to changed files).

## Risks Carried

- Partial write in `Promise.all` fan-out (`saveCityTax` completes before `saveActivity` per occupant): pre-existing pattern, now applies to cases B/C too. Accepted; `isSaving` guard prevents double-submit. Modal stays open on error, toast shown.

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 1.00 | 42375 | 22252 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 58232 | 13977 | 0.0% |
| lp-do-plan | 1 | 1.00 | 86553 | 22827 | 0.0% |
| lp-do-build | 1 | 2.00 | 103460 | 0 | 0.0% |

- Context input bytes: 290,620
- Artifact bytes: 59,056 (pre-build)
- Modules loaded: 5
- Deterministic checks: 7
- Token measurement: not captured (session-based capture unavailable)
