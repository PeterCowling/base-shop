---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: Prime
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-11
Last-reviewed: 2026-02-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-hardcoded-copy-i18n-remediation
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: build-feature
Supporting-Skills: none
Related-Plan: docs/plans/prime-hardcoded-copy-i18n-remediation-plan.md
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: TBD
---

# Prime Hardcoded Copy and i18n Remediation Fact-Find Brief

## Scope
### Summary
Prime currently has large lint volume from ds/no-hardcoded-copy and partial i18n wiring. The required split is:
1) non-user-facing strings should be handled through meta lint exceptions (config/rule-level, not inline waivers), and
2) user-facing copy must migrate to i18n with locale-complete coverage for supported locales.

### Goals
- Quantify Prime lint debt and isolate ds/no-hardcoded-copy scope.
- Separate non-user-facing copy from guest-facing copy using repo evidence.
- Validate current Prime i18n runtime wiring and locale asset availability.
- Identify blockers to locale-complete behavior across supported locales.
- Produce planning-ready remediation seeds.

### Non-goals
- Applying code migrations in this fact-find.
- Rewriting the lint rule implementation in this step.
- Shipping translation content in this step.

### Constraints and assumptions
- Constraints:
  - Avoid inline suppressions unless there is no better structural option.
  - Keep changed-file lint gate behavior intact for CI and local workflows.
  - Preserve existing guest flows while migrating copy keys.
- Assumptions:
  - Prime must support multilingual guests and cannot rely on English-only runtime fallback for production UX.

## Evidence Audit (Current State)
### Entry points
- apps/prime/package.json:9
  - lint command uses apps/prime/scripts/lint-wrapper.sh.
- apps/prime/scripts/lint-wrapper.sh:29-33
  - full lint mode is non-blocking because eslint is followed by "|| true".
- eslint.config.mjs:2266-2296
  - Prime catch-all sets ds/no-hardcoded-copy to warn.
- packages/eslint-plugin-ds/src/rules/no-hardcoded-copy.ts:165-320
  - hardcoded-copy lint rule behavior and exemptions.
- apps/prime/src/i18n.optimized.ts:33-57
  - Prime i18n runtime definition and backend load path.

### Lint distribution (full Prime scan on 2026-02-11)
Command used:
- pnpm exec eslint "apps/prime/**/*.{ts,tsx,js,jsx}" --format json --no-error-on-unmatched-pattern

Results:
- 331 files scanned
- 23 errors
- 1498 warnings
- 1172 warnings from ds/no-hardcoded-copy (78.2 percent of all warnings)

Top rule counts:
- ds/no-hardcoded-copy: 1172
- ds/no-unsafe-viewport-units: 68
- ds/container-widths-only-at: 65
- ds/min-tap-size: 49
- ds/enforce-layout-primitives: 32

Hardcoded-copy split:
- tests_cypress: 793 warnings across 100 files
- internal_ops: 82 warnings across 8 files
- guest_surface: 93 warnings across 28 files
- shared_logic: 127 warnings across 30 files
- other_prod: 77 warnings across 22 files

Classification methodology (directory-pattern based):
- **tests_cypress**: files matching `**/__tests__/**`, `**/*.test.*`, `**/*.spec.*`, `**/*.cy.*`, `**/cypress/**`
- **internal_ops**: files under `apps/prime/src/app/owner/**` and `apps/prime/src/app/staff-lookup/**` (operator/admin panels, not guest-visible)
- **guest_surface**: files under `apps/prime/src/app/(guarded)/**`, `apps/prime/src/app/checkin/**`, `apps/prime/src/app/find-my-stay/**`, `apps/prime/src/components/homepage/**`, `apps/prime/src/components/welcome/**`, `apps/prime/src/components/auth/**`, `apps/prime/src/components/positano-guide/**`, `apps/prime/src/components/quests/**` (routes/components rendered to hotel guests)
- **shared_logic**: files under `apps/prime/src/data/**`, `apps/prime/src/lib/**`, `apps/prime/src/hooks/**`, `apps/prime/src/services/**` (utilities, data, business logic consumed by multiple surfaces)
- **other_prod**: remaining production files not covered above (components/dev, portal onboarding, PWA infrastructure, profile, settings, misc components)

Edge cases and borderline classifications:
- `apps/prime/src/data/routes.ts` (40 warnings) → shared_logic: contains route labels and path definitions consumed by navigation. Some route labels are guest-visible; these should be evaluated per-string during migration, not bulk-exempted.
- `apps/prime/src/components/portal/GuidedOnboardingFlow.tsx` (26 warnings) → other_prod: onboarding flow is guest-facing but sits outside the (guarded) route group. Treat as guest_surface for migration purposes.
- `apps/prime/src/lib/assistant/answerComposer.ts` (14 warnings) → shared_logic: AI assistant response templates. Some strings are guest-visible via chat; needs per-string review.

Non-test hardcoded-copy total:
- 379 warnings across 88 files

Highest-volume non-test files:
- apps/prime/src/data/routes.ts (40)
- apps/prime/src/app/owner/scorecard/page.tsx (37)
- apps/prime/src/components/portal/GuidedOnboardingFlow.tsx (26)
- apps/prime/src/app/(guarded)/booking-details/page.tsx (20)
- apps/prime/src/app/owner/page.tsx (14)
- apps/prime/src/lib/assistant/answerComposer.ts (14)

### Lint config precedence issue (root cause)
- Test override disables hardcoded-copy globally at eslint.config.mjs:985-1014.
- Prime catch-all later re-enables hardcoded-copy as warn for apps/prime/** at eslint.config.mjs:2266-2286.
- Prime dev-tools override exists at eslint.config.mjs:2255-2261 but appears before the catch-all and is overridden by it.

Implication:
- Large avoidable warning noise in tests/dev-internal areas because override ordering defeats intended exceptions.

### Rule behavior relevant to exception strategy
- Existing built-in exemptions include console strings and Error messages:
  - packages/eslint-plugin-ds/src/rules/no-hardcoded-copy.ts:255-260
- Rule supports configurable ignoreProperties and ignorePatterns:
  - packages/eslint-plugin-ds/src/rules/no-hardcoded-copy.ts:174-203
- Rule treats strings wrapped by t(...) as exempt:
  - packages/eslint-plugin-ds/src/rules/no-hardcoded-copy.ts:56-72 and 293

Risk:
- Fallback English inside t(key, "English") and defaultValue objects is not flagged as hardcoded-copy.

### Prime i18n runtime wiring
Current code:
- i18n runtime file exists: apps/prime/src/i18n.optimized.ts.
- i18next backend path expects browser-served namespace files: /locales/{{lng}}/{{ns}}.json.
- Root layout does not initialize i18n runtime and hardcodes html lang="en":
  - apps/prime/src/app/layout.tsx:22
- Root providers only mount PinAuthProvider:
  - apps/prime/src/app/providers.tsx:5-12
- I18nPreloader and LazyTranslations exist but are not consumed by app shell/routes:
  - apps/prime/src/components/i18n/I18nPreloader.tsx
  - apps/prime/src/components/i18n/LazyTranslations.tsx
  - no call sites found outside those files.
- Prime locale assets are effectively absent:
  - apps/prime/public/locales contains only .DS_Store.

Implication:
- Runtime translation loading path is configured but not operationally provisioned.

### Namespace drift
Namespaces used in useTranslation(...), non-test code:
- Activities, BookingDetails, Chat, FindMyStay, Homepage, Onboarding, PositanoGuide, PreArrival, Quests, Settings

Namespaces configured in NAMESPACE_GROUPS:
- Header, Homepage, Reused, BreakfastMenu, CompBreakfast, BarMenu, CompEvDrink, Account, BookingDetails, Payment, ActivityAdmin, GuestChat, BagStorage, MainDoorAccess, OvernightIssues, DocInsert, DigitalAssistant, Onboarding

Used but not configured:
- Activities, Chat, FindMyStay, PositanoGuide, PreArrival, Quests, Settings

Configured but not used:
- Header, Reused, BreakfastMenu, CompBreakfast, BarMenu, CompEvDrink, Account, Payment, ActivityAdmin, GuestChat, BagStorage, MainDoorAccess, OvernightIssues, DocInsert, DigitalAssistant

Implication:
- Route/namespace preloading currently targets mostly stale namespace names.

### Locale contract and completeness gaps
- UI locale contract: packages/types/src/constants.ts:16
  - UI_LOCALES = ["en", "it"]
- Content locale contract: packages/types/src/constants.ts:24-47
  - includes 19 locales total.
- Shared package/i18n JSON files currently present for:
  - en, de, es, fr, it, ja, ko
- Missing content locales in packages/i18n/src:
  - pt, ru, ar, hi, vi, pl, sv, da, hu, nb, zh-Hans, zh-Hant
- Completeness test is currently skipped:
  - packages/i18n/src/__tests__/translations-completeness.test.ts:6-8
- Translation guide is stale versus current locale model:
  - docs/i18n/add-translation-keys.md:11 still references only en/de/it.

Implication:
- "all locales we support" is not currently enforceable by tests for Prime flow.

### Hidden fallback-English footprint
Audit command:
- rg -n "\bt\([^\n,]+,\s*['\"]|defaultValue:\s*['\"]" apps/prime/src ...

Result:
- 47 non-test occurrences of inline fallback literals in t() calls/defaultValue.

Representative files:
- apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx
- apps/prime/src/app/(guarded)/chat/channel/page.tsx
- apps/prime/src/components/homepage/HomePage.tsx
- apps/prime/src/components/pwa/CacheSettings.tsx
- apps/prime/src/components/profile/ProfileCompletionBanner.tsx

### Data/contracts and language switching behavior
- Prime guest language is sourced from occupant data and applied at runtime:
  - apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts:211-230
- i18n.changeLanguage(occupantLang) is called directly without locale normalization gate.

Implication:
- Unsupported or unprovisioned language tags can degrade translation loading and user-visible consistency.

### Test Landscape

#### Test Infrastructure
- **Framework:** Jest (apps/prime/package.json:11).
- **Commands:** `pnpm --filter prime test -- <path>` for unit/integration; `pnpm --filter prime cypress:run` for E2E.
- **CI integration:** Changed-file lint gate runs on PRs (apps/prime/docs/CONTRIBUTING.md). Full-lint audit is non-blocking due to wrapper `|| true` (apps/prime/scripts/lint-wrapper.sh:31).
- **Coverage tools:** No explicit coverage threshold configured for Prime.

#### Existing Test Coverage (guest_surface files affected by migration)
| Area | Test Type | Test Files | Coverage Notes |
|------|-----------|-----------|----------------|
| `app/(guarded)/booking-details/` | unit | `__tests__/page.test.tsx`, `__tests__/extension-request.test.tsx` | Page rendering; extension request flow |
| `app/(guarded)/activities/` | unit | `__tests__/attendance-lifecycle.test.tsx` | Attendance state machine; mocks `useTranslation` |
| `app/(guarded)/chat/` | unit | `__tests__/guest-directory.test.tsx`, `channel/__tests__/page.test.tsx` | Directory rendering; channel page |
| `components/homepage/` | unit | `__tests__/SocialHighlightsCard.test.tsx`, `cards/__tests__/ServiceCard.test.tsx`, `cards/__tests__/TaskCard.test.tsx` | Card rendering; no HomePage.tsx test |
| `components/auth/FindMyStay.tsx` | none | — | No tests for guest auth entry point |
| `components/positano-guide/` | none | — | No tests for guide component |
| `components/quests/` | unit | `__tests__/QuestCard.test.tsx` | QuestCard only; BadgeCollection and TierCompletionModal untested |

#### Test Patterns & Conventions
- Unit tests mock `useTranslation` with `(key: string) => key` — tests verify key names, not translated output.
- E2E tests (Cypress): 5 spec files covering primary guest journey, arrival day, deep linking, offline PWA, expired token recovery.
- Test data: Firebase mocks in `cypress/support/prime-mocks.ts`; no shared fixture factory.

#### Coverage Gaps (Planning Inputs)
- **Untested guest_surface paths:** `FindMyStay.tsx`, `PositanoGuide.tsx`, `HomePage.tsx`, `BadgeCollection.tsx`, `TierCompletionModal.tsx` — no unit tests.
- **No i18n integration tests:** No test verifies that locale switching loads correct translations or that missing namespace files produce expected fallback behavior.
- **No locale-completeness enforcement:** `translations-completeness.test.ts` is skipped (`describe.skip` at line 8).

#### Testability Assessment
- **Easy to test:** Lint config changes (eslint override ordering) — existing `ds-lint-regression-guard.test.ts` pattern can be extended.
- **Easy to test:** Namespace manifest alignment — static analysis of useTranslation calls vs NAMESPACE_GROUPS.
- **Hard to test:** End-to-end locale switching — requires i18n bootstrap to be wired, locale files to exist, and a running dev server or component-level i18n provider mock.
- **Test seams needed:** i18n provider wrapper for component tests that need real translation loading (currently all tests mock `useTranslation`).

#### Recommended Test Approach
- **Unit tests for:** Lint config override ordering (extend regression guard), namespace manifest sync, locale file existence per supported locale.
- **Integration tests for:** i18n bootstrap initialization (provider mounts, preloader connected, html lang updates).
- **Contract tests for:** Fallback behavior when namespace file is missing for a locale.
- **E2E tests for:** Guest locale switching on booking-details and homepage (post-bootstrap).
- Stale docs: `apps/prime/docs/CONTRIBUTING.md:59-66` claims disabled DS rules in `.eslintrc.cjs`, but active config is flat `eslint.config.mjs` — update during documentation task.

### Recent targeted git history
Relevant signals:
- b068583b1b feat(prime-ui-theme-centralization): remove blanket DS bypass, enforce DS rules for Prime (TASK-10)
- 8c7f3e71c3 test(prime-ui-theme-centralization): add DS lint regression guard (TASK-11)
- 42bc667052 feat(prime): implement Wave 1 tasks including lint gate (TASK-50)

Interpretation:
- Prime lint posture intentionally tightened, but hardcoded-copy strategy and i18n runtime completion were not fully closed.

## External Research
- Not required. Repository evidence was sufficient.

## Questions
### Resolved
- Q: Is hardcoded-copy volume mostly from ds/no-hardcoded-copy?
  - A: Yes, 1172 of 1498 warnings.
  - Evidence: full eslint JSON audit on 2026-02-11.

- Q: Can non-user-facing copy be handled structurally instead of inline exceptions?
  - A: Yes. Existing rule/config supports meta controls (file pattern ordering, ignoreProperties, ignorePatterns).
  - Evidence: eslint.config.mjs and rule options in packages/eslint-plugin-ds/src/rules/no-hardcoded-copy.ts.

- Q: Is Prime i18n fully wired for locale loading today?
  - A: No. Runtime file exists but bootstrapping and locale assets are incomplete.
  - Evidence: apps/prime/src/app/layout.tsx, apps/prime/src/app/providers.tsx, apps/prime/public/locales.

### Open (User input needed)
- Q1: For Prime guest UI, should "all supported locales" mean UI_LOCALES only (en/it) or full CONTENT_LOCALES set?
  - Why it matters: Determines migration scope, translation operations load, and acceptance criteria.
  - Decision impacted: locale-completeness gate design and release plan.
  - Decision owner: Pete
  - Recommended default: full CONTENT_LOCALES for guest-facing copy because user requirement is multinational guest support.
  - Risk: larger initial translation backlog; requires phased rollout and fallback policy.

- Q2: Should Prime use shared package i18n source as canonical, or continue app-local namespace files under apps/prime/public/locales?
  - Why it matters: Single source of truth, tooling reuse, and CI completeness checks.
  - Decision impacted: architecture of translation build/sync pipeline.
  - Decision owner: Pete
  - Recommended default: shared canonical source with deterministic Prime namespace export step.
  - Risk: migration complexity across existing namespace naming.

- Q3: Who owns translation content production for Prime, and what is the delivery timeline relative to code work?
  - Why it matters: Code wiring without translation content delivers no guest value. If translations depend on a manual process or external vendor, the code and content workstreams must be sequenced.
  - Decision impacted: rollout phases, acceptance criteria, and whether to ship with English-only fallback initially.
  - Decision owner: Pete
  - Recommended default: Agent-assisted translation using existing `/improve-translate-guide` workflow, phased by locale priority (it first, then top-5 guest languages).
  - Risk: If no translation ops path is defined, code work ships but guests see untranslated keys or stale English.

## Confidence Inputs (for /plan-feature)
- Implementation: 76%
  - Strong evidence for root causes and change points; some uncertainty remains on locale contract scope.
  - To reach >=80: lock locale scope and canonical translation source.
  - To reach >=90: run small spike proving end-to-end load for one non-en locale on two guest routes.

- Approach: 71%
  - Meta exceptions + i18n migration is directionally correct and aligned with long-term quality.
  - To reach >=80: choose namespace governance model (manifest ownership and naming).
  - To reach >=90: add lint/test enforcement for namespace existence and fallback-literal restrictions.

- Impact: 85%
  - Blast radius is mapped across lint config, i18n bootstrap, guest routes, and shared locale assets.
  - To reach >=90: produce complete call-site inventory for all non-test useTranslation/t() usage and route coverage map.

- Delivery-Readiness: 64%
  - Technical work is clear, but owner/channel contract for translation ops and locale SLA is not yet fixed.
  - To reach >=80: define owner, rollout phases, and quality gates per locale.
  - To reach >=90: add CI gates + reviewer checklist + rollback plan for missing locale payloads.

- Testability: 74%
  - Existing jest/lint infra can support this work; missing completeness and namespace tests lower confidence.
  - To reach >=80: add targeted tests for namespace availability and locale fallback policy.
  - To reach >=90: re-enable or replace completeness tests with enforced pass criteria in CI.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Meta lint exceptions are too broad, silencing future real hardcoded-copy violations in exempted directories | Medium | High | Use narrow file-pattern globs (not directory wildcards); add a "new hardcoded-copy in exempted path" audit test that flags unexpected growth |
| Translation content never produced after code wiring ships | High | High | Blocked on Q3 (translation ops owner). Mitigate by defining ops path before starting code migration waves |
| Unsupported locale tags from occupant data cause runtime i18n loading errors | Medium | Medium | Add locale normalization gate before `i18n.changeLanguage()` call; map unknown tags to nearest supported locale or fallback to `en` |
| Namespace rename/alignment breaks existing `t()` call sites during migration | Medium | Medium | Run namespace rename as an atomic task with automated find-and-replace; add test asserting all useTranslation namespaces exist in NAMESPACE_GROUPS |
| Guest UX regression during phased copy migration (partial keys, missing translations) | Medium | High | Require per-wave acceptance: all keys in wave must have translations for chosen locales before merging. Keep English fallback as safety net during rollout |
| Lint warning count drops via exceptions without actual translation improvement (Goodhart risk) | Medium | Low | Track untranslated-key incidents and locale-switch success rate alongside warning count. Warning reduction alone is not a success metric |

## Planning Constraints and Notes
- Prefer structural lint exceptions over inline comments:
  - Reorder/segment eslint overrides so test/dev/internal paths are excluded after Prime catch-all.
  - Use rule options for known non-user-facing properties/patterns.
- Keep inline i18n-exempt comments as last resort with ticket IDs only.
- Treat fallback English in t(..., "...") and defaultValue as migration debt, not completion.
- Do not rely on empty Prime locale directory with runtime backend loading.
- Keep docs in sync with actual flat ESLint config and locale model.
- Rollout/rollback expectations:
  - Lint exception changes (eslint.config.mjs reordering) are low-risk and instantly revertible via git revert.
  - i18n bootstrap wiring should be behind a feature check or conditional import so it can be disabled without removing code.
  - Copy migration waves should be merged per-wave (not all-at-once) so partial rollback is a single revert.
  - If locale assets are missing at runtime, i18n fallbackLng: 'en' ensures English is always shown — no blank screens.

## Suggested Task Seeds (Non-binding)
1. Lint exceptions architecture pass
- Fix eslint.config.mjs override order for Prime test/dev/internal patterns.
- Define explicit meta exception blocks for non-user-facing paths.

2. Prime i18n bootstrap completion
- Ensure i18n init is mounted once in app shell and preloader hooks are connected.
- Resolve html lang handling strategy from active locale.

3. Namespace governance
- Build a single namespace manifest from real useTranslation usage.
- Align NAMESPACE_GROUPS to active namespaces and route groups.

4. Locale asset pipeline
- Decide canonical source and automate Prime-consumable locale namespace outputs.
- Add missing locales required by chosen contract.

5. Guest-facing copy migration wave 1
- Migrate highest-volume guest files first (booking-details, activities, chat channel, homepage).
- Remove fallback English literals where translation keys exist.

6. Non-user-facing copy cleanup wave
- Move route/data/owner/internal text into approved exception categories or key-based strings based on function.

7. Enforcement and tests
- Add test for namespace files existing per supported locale.
- Add guard against fallback English literals in guest-facing paths.
- Re-enable or replace translation completeness checks.

8. Documentation updates
- Update Prime contributing docs to match flat ESLint reality and i18n policy.
- Update docs/i18n/add-translation-keys.md locale guidance.

## Execution Routing Packet
- Primary execution skill:
  - build-feature
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Lint config exceptions are structural and documented.
  - Guest-facing copy in migrated scope is key-based and locale-resolved.
  - Prime locale loading works for every selected supported locale contract.
  - CI/lint/test gates catch regressions in namespace and translation completeness.
  - Docs reflect current architecture and policies.
- Post-delivery measurement plan:
  - Track ds/no-hardcoded-copy warning reduction in Prime full-lint audit.
  - Track untranslated/missing-key incidents in non-en locales.
  - Track locale-switch success on guest entry flows.

## Planning Readiness
- Status: Needs-input
- Blocking items:
  - Q1: Locale contract scope decision (UI_LOCALES vs CONTENT_LOCALES for Prime guest UI).
  - Q2: Canonical translation source decision (shared package vs app-local runtime files).
  - Q3: Translation ops ownership and delivery timeline.
- Recommended next step:
  - Answer open questions (all owned by Pete), then proceed to /plan-feature.
