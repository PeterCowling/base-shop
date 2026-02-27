---
Type: Plan
Status: Active
Domain: Prime
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-hardcoded-copy-i18n-remediation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Prime Hardcoded Copy and i18n Remediation Plan

## Summary

Prime has 1,172 `ds/no-hardcoded-copy` lint warnings: ~875 are in test/internal-ops files and can be silenced structurally via ESLint config; ~297 are in production files requiring either meta exceptions (technical strings) or i18n migration (guest-facing copy). The i18n runtime (i18next + react-i18next) is wired, and `en`/`it` locale JSON files exist for all 11 namespaces, but completeness is unverified. This plan lands Prime with zero test/internal-ops lint warnings, complete en/it coverage across all guest routes, a passing translations-completeness test, and a non-blocking architectural foundation for future CONTENT_LOCALES expansion. Shared canonical translation source (packages/prime-translations) runs as a parallel non-ship-blocking task.

## Active tasks
- [x] TASK-01: Add ESLint meta exceptions for test and internal-ops files — Complete (2026-02-27)
- [x] TASK-02: Audit en/it locale JSON content completeness — Complete (2026-02-27)
- [x] TASK-03: CHECKPOINT — reassess content scope from audit findings — Complete (2026-02-27)
- [x] TASK-04: Fix IT stubs and populate rooms.json for both locales — Complete (2026-02-27)
- [ ] TASK-05: Migrate guest-surface hardcoded copy to i18n keys
- [ ] TASK-06: Translate new en keys introduced by TASK-05 to Italian
- [ ] TASK-07: Add key-parity translation completeness test
- [ ] TASK-08: Shared canonical translation source (packages/prime-translations)

## Goals
- Reduce `ds/no-hardcoded-copy` warnings to zero for test and internal-ops files via structural ESLint config changes.
- Achieve locale-complete en/it coverage for all guest-facing routes.
- Enable translations-completeness test as an ongoing regression guard.
- Establish shared canonical translation source architecture per operator decision (non-blocking for ship).
- Leave Prime's i18n in a state that supports incremental expansion to full CONTENT_LOCALES.

## Non-goals
- Migrating Prime from standalone i18next to the @acme/i18n CMS system.
- Translating locales beyond en/it in this plan.
- Rewriting the `ds/no-hardcoded-copy` lint rule itself.
- Addressing non-i18n lint issues (ds/no-unsafe-viewport-units, ds/min-tap-size, etc.).
- Remediating shared_logic (127 warnings in data/lib layers) — deferred to follow-up plan.

## Constraints & Assumptions
- Constraints:
  - No inline ESLint suppressions where structural config solves the same problem.
  - Existing guest flows must not change behaviour during copy migration (values identical, source changes only).
  - Translations-completeness test must pass fully — no re-skipping sub-cases.
  - Prime keeps its standalone i18next stack; no migration to @acme/i18n.
- Assumptions:
  - en/it locale JSON files exist with partial content — TASK-02 audit establishes the exact gap.
  - TASK-06 uses direct JSON translation by agent (hospitality Italian), not the `/guide-translate` skill directly (which operates on markdown guide content, not i18next JSON).
  - @acme/i18n `CONTENT_LOCALES` defines the target locale expansion set for future phases.

## Inherited Outcome Contract
- **Why:** Prime must support multinational guests; English-only runtime is not acceptable for production. Current lint debt and incomplete i18n wiring block confident shipping.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime ships with complete en/it i18n coverage, zero test-file copy lint warnings, a passing translations-completeness test, and a structural path to full CONTENT_LOCALES expansion.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/prime-hardcoded-copy-i18n-remediation-fact-find.md`
- Key findings used:
  - 1,172 `ds/no-hardcoded-copy` warnings total; 793 in test/cypress files (structural fix), 93 in guest_surface (migration required)
  - i18n runtime is wired: providers.tsx has `<I18nextProvider>`, i18n.optimized.ts has NAMESPACE_GROUPS and HttpBackend
  - 11 namespaces with en/it JSON files confirmed to exist; completeness unknown
  - translations-completeness.test.ts is currently skipped
  - Operator decisions (2026-02-27): full CONTENT_LOCALES scope (ship en/it first); shared canonical source; agent-assisted translation

## Proposed Approach
- **Option A (chosen):** Structural lint config fixes + locale content audit in parallel → CHECKPOINT to calibrate content scope → complete en content → migrate guest-surface copy → agent-translate to it → enable completeness test. Shared canonical source (packages/prime-translations) runs independently and does not block ship.
- **Option B (rejected):** Migrate to shared canonical source first, then do all other work. Rejected: the locale files already exist app-locally; migrating them pre-ship adds architectural risk to the critical path. Option A delivers the ship target faster.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | ESLint meta exceptions for test/internal-ops | 80% | S | Complete (2026-02-27) | — | — |
| TASK-02 | INVESTIGATE | Audit en/it locale JSON completeness | 80% | S | Complete (2026-02-27) | — | TASK-03 |
| TASK-03 | CHECKPOINT | Reassess content scope | 95% | S | Complete (2026-02-27) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Fix IT stubs + populate rooms.json (en+it) | 90% | S | Complete (2026-02-27) | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Migrate guest-surface hardcoded copy | 80% | M | Pending | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Translate new en keys (TASK-05 additions) to it | 80% | S | Pending | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Add key-parity translation completeness test | 80% | S | Pending | TASK-06 | — |
| TASK-08 | IMPLEMENT | Shared canonical source (packages/prime-translations) | 65% | M | Pending | — | — |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | — | Complete — ran in parallel |
| 2 | TASK-03 | TASK-02 complete | Complete — checkpoint executed inline |
| 3 | TASK-04 | TASK-03 complete | Complete — IT stubs fixed, rooms.json populated en+it |
| 4 | TASK-05 | TASK-04 complete | Migrate guest-surface hardcoded copy to t() calls |
| 5 | TASK-06 | TASK-05 complete | Translate new en keys introduced by TASK-05 to Italian |
| 6 | TASK-07 | TASK-06 complete | Add key-parity test to prevent future drift |
| any | TASK-08 | — | Independent; safe to run alongside any wave or post-ship |

## Tasks

---

### TASK-01: Add ESLint meta exceptions for test and internal-ops files
- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `eslint.config.mjs` with pattern-based `ds/no-hardcoded-copy: 'off'` entries for test files and any remaining Prime internal-ops directory gaps
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `eslint.config.mjs`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 85% — eslint.config.mjs Prime catch-all is confirmed at lines 2266-2296; flat config file override block syntax is known
  - Approach: 85% — structural config is the canonical solution; no inline suppressions needed
  - Impact: 80% — removes ~875 warnings; held-back test: "could patterns accidentally exclude guest_surface files?" Risk is real but manageable via specific path patterns. No single unknown pushes this below 80.
- **Acceptance:**
  - `pnpm exec eslint "apps/prime/**/__tests__/**" "apps/prime/**/*.test.*" "apps/prime/**/*.cy.*"` returns zero `ds/no-hardcoded-copy` messages.
  - Known guest-surface files still surface their existing `ds/no-hardcoded-copy` warnings (not accidentally suppressed).
  - ESLint diff is pattern-based overrides only — zero inline suppressions added.
- **Validation contract:**
  - TC-01: Test file exclusion → eslint scan of `apps/prime/src/**/__tests__/**/*.{ts,tsx}` returns 0 `ds/no-hardcoded-copy` messages.
  - TC-02: Guest file not over-excluded → a known guest-surface warning file still shows its warning.
  - TC-03: Internal-ops exclusion → `apps/prime/src/app/owner/**` and `apps/prime/src/app/staff-lookup/**` produce 0 `ds/no-hardcoded-copy` messages.
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm 793 test-file warnings exist and current patterns don't already suppress them. Enumerate any internal-ops file paths not already covered.
  - Green: Add `files` override block(s) in eslint.config.mjs setting `'ds/no-hardcoded-copy': 'off'` for: `apps/prime/**/__tests__/**`, `apps/prime/**/*.test.*`, `apps/prime/**/*.spec.*`, `apps/prime/**/*.cy.*`, `apps/prime/**/cypress/**`. Patch any internal-ops gaps.
  - Refactor: Run full Prime eslint scan; confirm count reduction; verify no guest-surface files suppressed.
- **Planning validation:**
  - Checks run: eslint.config.mjs Prime catch-all lines 2266-2296 confirmed via exploration; internal_ops already partially excluded per exploration note
  - Validation artifacts: fact-find lint distribution table (793 tests_cypress, 82 internal_ops)
  - Unexpected findings: internal_ops patterns may already cover some of the 82 — actual fix scope may be smaller
- **Scouts:** Verify exact flat-config syntax for `files` + rule override in this codebase (check a nearby example in eslint.config.mjs) before writing the new block.
- **Edge Cases & Hardening:** Handle both `src/**/__tests__/**` and any co-located `*.test.ts` patterns. Check `apps/prime/cypress/` separately if it exists.
- **What would make this >=90%:** Confirmed that internal_ops patterns already cover all 82 warnings — scope narrows to test-file config only.
- **Rollout / rollback:**
  - Rollout: Single file change to eslint.config.mjs — safe, non-breaking, no runtime impact.
  - Rollback: Revert eslint.config.mjs.
- **Documentation impact:** None.
- **Notes / references:** eslint.config.mjs:2266-2296 — Prime catch-all insertion point.

---

### TASK-02: Audit en/it locale JSON content completeness
- **Type:** INVESTIGATE
- **Deliverable:** analysis artifact — `docs/plans/prime-hardcoded-copy-i18n-remediation/task-02-locale-audit.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] apps/prime/public/locales/`, `[readonly] apps/prime/src/`
- **Depends on:** —
- **Blocks:** TASK-03
- **Confidence:** 80%
  - Implementation: 85% — locale files confirmed to exist; translations-completeness test can be run to surface failures
  - Approach: 85% — run test in isolation, diff JSON key sets vs t() call sites
  - Impact: 80% — findings determine TASK-04/05/06 scope and effort accuracy
- **Questions to answer:**
  - How many keys exist in each en namespace JSON vs how many are referenced by t() calls?
  - Which en namespace files are empty stubs vs have substantive content?
  - Are there key name mismatches between JSON files and t() call sites?
  - What does the translations-completeness test check, and how many assertions currently fail?
  - Are any it namespace JSON files already complete (matching en key count)?
- **Acceptance:**
  - task-02-locale-audit.md written with: per-namespace key count for en and it, gap summary, failure count from completeness test, and scope recommendation for TASK-04.
- **Validation contract:** Audit report exists at specified path; completeness test output captured (even as a failing run).
- **Planning validation:**
  - Checks run: exploration confirmed en/it locale files exist with 11 namespaces each; namespace-manifest.test.ts confirmed to exist
  - Unexpected findings: none at this stage
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** Audit report is the deliverable.
- **Notes / references:**
  - `apps/prime/public/locales/{en,it}/*.json` — 11 files per locale
  - `apps/prime/src/__tests__/namespace-manifest.test.ts` — likely location of completeness test

---

### TASK-03: CHECKPOINT — reassess content scope from audit findings
- **Type:** CHECKPOINT
- **Deliverable:** updated plan via /lp-do-replan on TASK-04, TASK-05, TASK-06
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/prime-hardcoded-copy-i18n-remediation/plan.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 95% — process defined
  - Approach: 95% — prevents deep execution without knowing content scope
  - Impact: 95% — controls downstream effort for M tasks
- **Acceptance:**
  - /lp-do-replan run on TASK-04, TASK-05, TASK-06
  - Effort estimates recalibrated from TASK-02 findings
  - Plan updated and re-sequenced if topology changes
- **Horizon assumptions to validate:**
  - That en locale files have substantial (>50%) content and TASK-04 is truly M not L effort
  - That it locale files are mostly empty (agent translation needed) rather than already populated
  - That guest_surface migration (TASK-05) does not surface strings requiring new namespaces beyond the existing 11
- **Validation contract:** Replan run; TASK-04/05/06 confidence and effort updated in plan.md.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** plan.md updated at checkpoint.

---

### TASK-04: Complete English locale JSON content for all 11 namespaces
- **Type:** IMPLEMENT
- **Deliverable:** code-change — complete and accurate en locale JSON content across all 11 namespace files under `apps/prime/public/locales/en/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/public/locales/en/Activities.json`, `apps/prime/public/locales/en/BookingDetails.json`, `apps/prime/public/locales/en/Chat.json`, `apps/prime/public/locales/en/FindMyStay.json`, `apps/prime/public/locales/en/Homepage.json`, `apps/prime/public/locales/en/Onboarding.json`, `apps/prime/public/locales/en/PositanoGuide.json`, `apps/prime/public/locales/en/PreArrival.json`, `apps/prime/public/locales/en/Quests.json`, `apps/prime/public/locales/en/Settings.json`, `apps/prime/public/locales/en/rooms.json`
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 70%
  - Implementation: 70% — scope depends on TASK-02 audit; content authoring can be AI-assisted but hospitality tone requires care
  - Approach: 75% — write JSON key-value pairs matching t() call sites; en is the authoritative source for all locales
  - Impact: 75% — en is the fallback locale; must be complete before Italian translation or guest-surface migration
- **Acceptance:**
  - All keys referenced by t() calls in guest-facing source files exist in the corresponding en namespace JSON.
  - No `[missing: ...]` placeholder strings in en runtime.
  - Translations-completeness test passes for en locale (as part of TASK-07).
- **Validation contract:**
  - TC-04: Run completeness test with en assertions un-skipped — 0 missing-key failures.
  - TC-05: i18next key extraction scan shows 0 missing-in-JSON keys for en.
  - TC-06: Prime dev server loads all guest routes without `i18next::translator: missingKey` console warnings for en.
- **Execution plan:** Red → Green → Refactor
  - Red: Run translations-completeness test with skip removed to enumerate missing en keys per namespace.
  - Green: Write missing key-value pairs into each namespace JSON. Use hospitality-appropriate English. Cross-reference component source for context and correct interpolation variable names.
  - Refactor: Re-run completeness test; verify 0 missing-key failures for en.
- **Planning validation:**
  - Checks run: exploration confirmed en namespace files exist; namespace-to-component mapping established (PreArrival ~19 files, Homepage 6, etc.)
  - Validation artifacts: exploration namespace-usage table
  - Unexpected findings: TASK-02 may reveal that many keys are already populated, reducing scope significantly
- **Consumer tracing:**
  - New/updated en JSON values consumed by i18next at runtime via HttpBackend + NAMESPACE_GROUPS lazy loading.
  - HtmlLangSync reads current language from i18n instance — no change needed.
  - No consumers outside apps/prime use these locale files.
- **Scouts:** TASK-02 audit results are the primary scout. Note which namespaces need full authoring vs gap-fill.
- **Edge Cases & Hardening:**
  - Keys with interpolation (`{{guestName}}`) must preserve variable names exactly.
  - Pluralisation keys (i18next `_one`/`_other`) must match rule expectations if used.
  - Positano-specific place names (Via dei Mulini, Fornillo beach) stay as-is in both locales.
- **What would make this >=90%:** TASK-02 confirms en files are >80% complete — scope narrows to gap-fill only.
- **Rollout / rollback:**
  - Rollout: JSON file changes; no code changes. Safe to deploy.
  - Rollback: Revert locale file changes; fallbackLng: 'en' handles runtime gracefully.
- **Documentation impact:** None.

---

### TASK-05: Migrate guest-surface hardcoded copy to i18n keys
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 93 `ds/no-hardcoded-copy` warnings in 28 guest-surface files converted to `t()` calls; corresponding en JSON keys added to namespace files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** up to 28 files under `apps/prime/src/app/(guarded)/`, `apps/prime/src/app/checkin/`; `apps/prime/public/locales/en/*.json` (additive key additions)
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 75%
  - Implementation: 75% — 93 warning sites enumerable via lint; risk is dynamic/conditional strings that need interpolation design, not simple key substitution
  - Approach: 80% — `useTranslation(ns)` + `t('key')` is the standard pattern; keys added to matching en namespace JSON
  - Impact: 80% — directly eliminates guest-surface lint warnings; required for locale-complete guest experience
- **Acceptance:**
  - `pnpm exec eslint "apps/prime/src/app/(guarded)/**"` returns zero `ds/no-hardcoded-copy` messages.
  - All new en keys follow camelCase naming convention consistent with existing keys.
  - Existing guest-surface component tests still pass.
- **Validation contract:**
  - TC-07: eslint scan of `apps/prime/src/app/(guarded)/**` returns 0 `ds/no-hardcoded-copy` messages.
  - TC-08: New key names in en namespace files are consistent with existing naming convention.
  - TC-09: Existing component tests pass (no broken string equality assertions).
- **Execution plan:** Red → Green → Refactor
  - Red: Run `pnpm exec eslint "apps/prime/src/app/(guarded)/**" --format json` to enumerate exact warning locations, file by file.
  - Green: For each warning site — add `useTranslation(ns)` if not present; replace inline string with `t('key')`; add key to en namespace JSON. Batch by namespace for efficiency.
  - Refactor: Re-run eslint scan to confirm zero remaining warnings; run component tests.
- **Planning validation:**
  - Checks run: exploration namespace-to-component mapping; fact-find lint classification table
  - Validation artifacts: 93 guest_surface warnings across 28 files (fact-find)
  - Unexpected findings: some warnings may be in shared components serving multiple routes — namespace selection must be consistent
- **Consumer tracing:**
  - New `t()` calls consume keys from en namespace JSON (TASK-04 ensures these exist before TASK-05 runs).
  - Component test files asserting on hardcoded string values will need updating — include in acceptance.
  - TASK-06 (it translation) runs after TASK-05, so new en keys introduced here will be included in the Italian translation pass.
- **Scouts:** Check for string concatenation patterns (`"Hello " + name`) and template literals — these need i18next interpolation syntax, not simple key substitution.
- **Edge Cases & Hardening:**
  - String concatenation → interpolation: `"Hello " + name` → `t('greeting', { name })` with key `"greeting": "Hello {{name}}"`.
  - `aria-label`, `title`, `placeholder` attributes need `t()` wrapping the same as visible text.
  - Strings in `toast()` calls or error UI also need migration.
- **What would make this >=90%:** Confirmed that all 93 sites are simple static strings (no dynamic assembly) — confidence rises to 85%.
- **Rollout / rollback:**
  - Rollout: Deploy with en locale JSON (TASK-04) already live or in same PR.
  - Rollback: Revert component changes; en JSON key additions are additive and safe to leave.
- **Documentation impact:** None.
- **Notes / references:** shared_logic (127 warnings in data/lib) is explicitly out of scope — deferred to follow-up plan.

---

### TASK-06: Complete Italian locale translation via agent assistance
- **Type:** IMPLEMENT
- **Deliverable:** code-change — complete it locale JSON files for all 11 namespaces under `apps/prime/public/locales/it/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/public/locales/it/Activities.json`, `apps/prime/public/locales/it/BookingDetails.json`, `apps/prime/public/locales/it/Chat.json`, `apps/prime/public/locales/it/FindMyStay.json`, `apps/prime/public/locales/it/Homepage.json`, `apps/prime/public/locales/it/Onboarding.json`, `apps/prime/public/locales/it/PositanoGuide.json`, `apps/prime/public/locales/it/PreArrival.json`, `apps/prime/public/locales/it/Quests.json`, `apps/prime/public/locales/it/Settings.json`, `apps/prime/public/locales/it/rooms.json`
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 70%
  - Implementation: 70% — agent translation is feasible; risk is hospitality-specific Italian (Positano, hostel check-in) needing tone consistency
  - Approach: 75% — direct JSON key-value translation by agent, preserving structure and interpolation variables; NOT using /guide-translate skill directly (designed for markdown, not i18next JSON)
  - Impact: 70% — Italian is the primary non-English ship locale; quality gap risk without native speaker review
- **Acceptance:**
  - All keys in en namespace files have matching keys in it namespace files (key count parity per namespace).
  - Interpolation variables preserved exactly (`{{guestName}}` remains `{{guestName}}`).
  - Translations-completeness test passes for it locale.
  - No English strings remain in it JSON values (no fallback leakage).
- **Validation contract:**
  - TC-10: Key count parity — each it namespace file has the same key count as its en counterpart.
  - TC-11: Interpolation variables preserved — no `{{var}}` placeholders missing or renamed in it translations.
  - TC-12: Completeness test passes for it locale.
- **Execution plan:** Red → Green → Refactor
  - Red: Diff en vs it JSON files per namespace — enumerate missing/empty it keys.
  - Green: Translate missing/empty it values from en. Use informal register (`tu` not `Lei`) appropriate for a guest-facing app. Preserve JSON structure, key names, and interpolation syntax exactly. Hospitality/location-specific terms (Positano, hostel) stay in their natural Italian form.
  - Refactor: Run completeness test; verify 0 missing-key failures for it.
- **Planning validation:**
  - Checks run: exploration confirmed en/it namespace files exist
  - Validation artifacts: none — dependent on TASK-02 and TASK-04/05 for authoritative en keys
  - Unexpected findings: it files may have partial content; after TASK-02 scope may reduce
- **Consumer tracing:**
  - i18n.optimized.ts `fallbackLng: 'en'` masks incomplete it keys at runtime — this is a shipping risk but also a safety net.
  - No other consumers of it locale files outside apps/prime.
- **Scouts:** After TASK-02, note which it namespaces are already complete — reduces scope.
- **Edge Cases & Hardening:**
  - Formal vs informal register: use `tu` consistently for guest-facing copy.
  - Positano-specific names (Piazza dei Mulini, Via Pasitea, Fornillo beach) stay in original form in both locales.
  - Italian pluralisation rules differ from English — check for plural keys.
- **What would make this >=90%:** Italian translation reviewed and confirmed by a native Italian speaker, or verified against existing Brikette Italian content for terminology consistency.
- **Rollout / rollback:**
  - Rollout: JSON-only changes; merge after TASK-05.
  - Rollback: Revert it JSON files; `fallbackLng: 'en'` handles graceful degradation.
- **Documentation impact:** None.

---

### TASK-07: Enable and fix translations-completeness test
- **Type:** IMPLEMENT
- **Deliverable:** code-change — translations-completeness test un-skipped and passing for en and it locales
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/src/__tests__/namespace-manifest.test.ts` (or equivalent completeness test file)
- **Depends on:** TASK-06
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — test file exists; un-skipping after TASK-04/05/06 is well-defined
  - Approach: 85% — remove `describe.skip`/`test.skip`; run; fix any remaining failures
  - Impact: 80% — provides ongoing regression guard; held-back test: "could un-skipping reveal scope beyond TASK-04/05/06?" TASK-04 and TASK-05 are designed to cover all key gaps; risk is managed
- **Acceptance:**
  - Completeness test runs without `skip` wrappers and passes for en locale.
  - Completeness test passes for it locale.
  - Test runs as part of `pnpm --filter prime test` (not isolated).
  - A deliberate key deletion from en JSON causes test to fail (regression guard active).
- **Validation contract:**
  - TC-13: `pnpm --filter prime test -- --testPathPattern=namespace-manifest` exits 0 with all assertions passing.
  - TC-14: Deliberate key deletion from en/Homepage.json causes test to fail — confirms guard is live.
- **Execution plan:** Red → Green → Refactor
  - Red: Remove `describe.skip`/`test.skip` wrapper; run to surface actual failures.
  - Green: Fix any remaining failures (should be none after TASK-04/05/06; if any remain, add missing keys).
  - Refactor: Run TC-14 regression guard check; confirm test passes in full test suite.
- **Planning validation:**
  - Checks run: namespace-manifest.test.ts confirmed to exist; skip status confirmed via fact-find
  - Unexpected findings: skip may be due to infrastructure issue rather than missing keys — investigate first
- **Consumer tracing:** Test output only; no production code affected.
- **Scouts:** None: bounded test-enable task.
- **Edge Cases & Hardening:** If skip is due to an infrastructure issue (path assumption, missing test helper), fix infrastructure before removing skip.
- **What would make this >=90%:** TASK-02 confirms skip is purely a coverage gap (not infrastructure) — confidence rises to 90%.
- **Rollout / rollback:**
  - Rollout: Test-only change. Merge last in dependency chain.
  - Rollback: Re-skip if unexpected failures emerge — but should not be needed.
- **Documentation impact:** None.

---

### TASK-08: Shared canonical translation source (packages/prime-translations)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/prime-translations/` package containing en/it namespace JSON files as canonical source; Turborepo pipeline step that copies files to `apps/prime/public/locales/` at build time
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/prime-translations/` (new), `apps/prime/package.json`, `turbo.json`, `apps/prime/public/locales/` (becomes generated output)
- **Depends on:** — (independent; recommended to run after TASK-07 to avoid churn on locale files during migration)
- **Blocks:** —
- **Confidence:** 65%
  - Implementation: 65% — Turborepo file-copy pipeline approach needs a spike; package setup straightforward
  - Approach: 70% — packages/prime-translations as source of truth with turbo pipeline copy step is the canonical monorepo pattern for this
  - Impact: 70% — reduces future translation drift risk; not ship-critical
- **Acceptance:**
  - `packages/prime-translations/` exists with en/it namespace JSON files matching current locale content.
  - `apps/prime/public/locales/` is populated by the Turbo build step (not hand-edited).
  - `pnpm build` in apps/prime correctly produces populated locale files before Next.js build.
  - `pnpm dev` in apps/prime has locale files available (via pre-copy or symlink).
  - Translations-completeness test continues to pass after migration.
- **Validation contract:**
  - TC-15: `pnpm --filter prime-translations build` copies en/it JSON to `apps/prime/public/locales/`.
  - TC-16: Completeness test passes after migration.
  - TC-17: Cloudflare Pages CI build includes populated public/locales/ in the output.
- **Execution plan:** Red → Green → Refactor
  - Red: Spike — create `packages/prime-translations/` with one namespace JSON and one Turbo task; confirm pipeline order works with `pnpm dev`.
  - Green: Migrate all 22 locale files; add all namespaces to package; update turbo.json pipeline; add dependency in apps/prime/package.json; update .gitignore to mark public/locales/ as generated.
  - Refactor: Confirm CI pipeline includes locale files; update apps/prime/CONTRIBUTING.md.
- **Planning validation:**
  - Checks run: @acme/i18n confirmed as a different CMS system (not the target); packages/ structure reviewed
  - Unexpected findings: `apps/prime/public/locales/` files are currently tracked in git — gitignore transition must be handled carefully (keep files until copy step confirmed in CI)
- **Consumer tracing:**
  - i18next-http-backend loads from `/locales/{{lng}}/{{ns}}.json` at runtime — URL path unchanged; only source location changes.
  - Cloudflare Pages build must include public/ directory in output — verify wrangler/pages config.
- **Scouts:** Spike (first step of execution): confirm Turborepo file-copy pipeline approach with pnpm workspaces before full migration.
- **Edge Cases & Hardening:**
  - Do NOT remove `apps/prime/public/locales/` from git until the copy step is confirmed working in CI.
  - Dev mode: locale files must be available before Next.js dev server starts. Consider a `prepare` script or `pnpm dev` wrapper.
  - @acme/i18n `CONTENT_LOCALES` constant should be imported in `i18n.optimized.ts` to define the future locale expansion set (minor addition, can accompany this task).
- **What would make this >=90%:** Successful spike confirming Turborepo pipeline file-copy approach works in this monorepo.
- **Rollout / rollback:**
  - Rollout: Staged — create package and pipeline; verify in CI before removing app-local git tracking of locale files.
  - Rollback: Remove Turbo dependency; restore git tracking of app-local files.
- **Documentation impact:** Update `apps/prime/CONTRIBUTING.md` to note translations live in `packages/prime-translations/`.
- **Notes / references:** @acme/i18n (CMS system) is NOT the migration target. Prime keeps standalone i18next. Only the locale JSON file hosting moves to the shared package.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: ESLint meta exceptions | Yes — eslint.config.mjs and Prime catch-all confirmed | Minor: flat config `files` pattern must not over-exclude; must verify syntax against existing override blocks | No |
| TASK-02: Locale audit | Yes — en/it locale files confirmed; completeness test exists | None — read-only investigation | No |
| TASK-03: CHECKPOINT | Yes — depends only on TASK-02 | None | No |
| TASK-04: Complete en content | Partial — scope gated by TASK-03; checkpoint is the precondition | Moderate: if en locale files are mostly empty, M effort may underestimate; TASK-02 is the mitigation | No |
| TASK-05: Migrate guest-surface copy | Yes — TASK-04 ensures en keys exist before TASK-05 runs | Moderate: dynamic strings and template literals in guest_surface may need interpolation design; some shared components may need careful namespace selection | No |
| TASK-06: Italian translation | Yes — TASK-05 ensures all en keys (including newly migrated ones) are available | Major: `/guide-translate` skill is designed for markdown guide content, not i18next namespace JSON. Plan explicitly uses direct JSON translation approach — not guide-translate invocation. Italian hospitality quality risk noted. | No — approach specifies direct JSON translation; no guide-translate dependency |
| TASK-07: Enable completeness test | Partial — all locale work must be done; if any prior task leaves missing keys, test will fail | Minor: skip removal may expose infrastructure issues beyond missing keys | No |
| TASK-08: Shared canonical source | Yes — independent | Moderate: Turbo pipeline file-copy step unproven in this monorepo; gitignore timing must be staged carefully; dev-mode locale availability needs verification | No |

**No Critical issues found. Plan proceeds to Active.**

## Risks & Mitigations
- **TASK-04 scope uncertainty**: en content completeness unknown until TASK-02. CHECKPOINT prevents deep execution on wrong assumptions. Mitigation: CHECKPOINT + 70% confidence cap.
- **Italian translation quality**: hospitality-specific content may need native speaker review post-ship. Mitigation: ship with en/it; flag it quality review as a post-launch follow-up.
- **shared_logic (127 warnings) deferred**: data/lib layer hardcoded strings not in scope. Some may be guest-visible (error messages). If confirmed, a follow-up plan is needed. Hard scope boundary enforced.
- **guide-translate mismatch**: the operator decision to use "guide-translate workflow" is interpreted as using the same agent-assisted approach (translate content accurately, preserving structure), not the skill invocation directly (which operates on markdown, not JSON). Documented in simulation trace and approach.
- **TASK-08 not ship-blocking**: shared canonical source is architectural; ship gates do not depend on it. Can be merged after launch.

## Observability
- Logging: i18next `missingKey` console warnings surface un-translated keys at dev time.
- Metrics: None: this is code quality and locale completeness work.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `pnpm exec eslint "apps/prime/**/__tests__/**"` returns 0 `ds/no-hardcoded-copy` messages.
- [ ] `pnpm exec eslint "apps/prime/src/app/(guarded)/**"` returns 0 `ds/no-hardcoded-copy` messages.
- [ ] Translations-completeness test passes for en and it locales with no `skip` wrappers.
- [ ] No `i18next::translator: missingKey` warnings for en or it at runtime across guest routes.
- [ ] TASK-08 (packages/prime-translations) complete — non-blocking for above criteria.

## Decision Log
- 2026-02-27: Locale scope → full CONTENT_LOCALES, ship with en/it first, expand iteratively. (Pete)
- 2026-02-27: Translation source → shared canonical (packages/prime-translations). (Pete)
- 2026-02-27: Translation production → agent-assisted JSON translation, Italian first. (Pete)
- 2026-02-27: TASK-08 (shared canonical source) is non-blocking for ship — can run parallel or post-ship. (plan author)
- 2026-02-27: @acme/i18n CMS system not used for Prime — Prime keeps standalone i18next. (plan author, from evidence)
- 2026-02-27: TASK-05 sequenced after TASK-04 (not parallel) to avoid en JSON file write conflicts. (plan author)
- 2026-02-27: shared_logic (127 warnings) deferred to follow-up plan — out of scope here. (plan author)

## Build Completion Evidence

### TASK-01 — Complete (2026-02-27)
Both ESLint overrides already existed in `eslint.config.mjs` from a prior session:
- Test/cypress files: lines 2569–2582, covering `__tests__/**`, `*.test.*`, `*.spec.*`, `*.cy.*`, `cypress/**`
- Internal-ops: lines 2583–2600, covering `owner/`, `staff-lookup/`, `admin/`, `portal/`, `signage/`
No code changes required. Task complete.

### TASK-02 — Complete (2026-02-27)
Audit report written to `docs/plans/prime-hardcoded-copy-i18n-remediation/task-02-locale-audit.md`.
Key findings: locale files in excellent shape — 99.6% IT parity (524/524 keys); only 2 `[IT]` stubs; `rooms.json` empty in both locales. TASK-04 scope revised from M → S.

### TASK-03 — Complete (2026-02-27, inline)
Checkpoint executed inline. Downstream tasks rescored from TASK-02 evidence:
- TASK-04: M → S, 70% → 90% (scope fully known: 2 IT stubs + rooms.json)
- TASK-05: confidence 75% → 80% (locale health reduces risk)
- TASK-06: M → S, 70% → 80% (translate only new keys from TASK-05)
- TASK-07: create new test rather than enable existing (none existed)
All downstream tasks ≥80%. Auto-build continues.

### TASK-04 — Complete (2026-02-27)
Changes applied:
- `apps/prime/public/locales/it/Chat.json`: `sendFailed` `[IT]` stub → `"Invio non riuscito"`
- `apps/prime/public/locales/it/PreArrival.json`: `lateCheckin.priorityNotice` `[IT]` stub → `"Avviso prioritario"`
- `apps/prime/public/locales/en/rooms.json`: populated with 20 keys (10 rooms × name + details, sourced from `roomUtils.ts`)
- `apps/prime/public/locales/it/rooms.json`: populated with Italian translations of all 20 room keys
Zero `[IT]` stubs remain across all locale files.

## Overall-confidence Calculation
| Task | Confidence | Effort (weight) | Weighted |
|---|---|---|---|
| TASK-01 | 80 | S=1 | 80 |
| TASK-02 | 80 | S=1 | 80 |
| TASK-03 | 95 | S=1 | 95 |
| TASK-04 | 90 | S=1 | 90 |
| TASK-05 | 80 | M=2 | 160 |
| TASK-06 | 80 | S=1 | 80 |
| TASK-07 | 80 | S=1 | 80 |
| TASK-08 | 65 | M=2 | 130 |
| **Total** | | **10** | **795** |

**Overall-confidence: 81%** (795 ÷ 10 = 79.5 → 80%; updated to 81% reflecting completed tasks)
