---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-19
Feature-Slug: turbopack-post-migration-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/archive/turbopack-post-migration-hardening-archived-2026-02-20/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Turbopack Post-Migration Hardening Fact-Find Brief

## Scope
### Summary
Turbopack is now active for Brikette `next dev`, but follow-up debt remains in policy enforcement, CI coverage, shared utility ownership, and workspace module resolution conventions. This brief isolates those post-migration gaps so `/lp-do-plan` can produce implementation tasks that remove drift and stop policy collisions.

### Goals
- Resolve repo policy conflicts that still enforce `next dev/build --webpack`.
- Remove duplicated guide URL helper logic to prevent drift.
- Define long-term CI validation for Brikette Turbopack dev behavior.
- Capture explicit follow-up scope for i18n workspace-resolution debt.

### Non-goals
- Migrating production builds from webpack to Turbopack.
- Refactoring unrelated Brikette page/content code.
- Changing business content or SEO copy.
- Retiring the shared webpack `@acme/i18n` dist alias in this hardening pass.

### Constraints & Assumptions
- Constraints:
  - Production deploy flows still call `next build --webpack` for Brikette (`.github/workflows/brikette.yml`).
  - Repo hooks/CI currently enforce a global webpack policy (`scripts/check-next-webpack-flag.mjs`).
  - Follow-up must honor AGENTS long-term quality rule (no temporary bypasses).
- Assumptions:
  - Brikette is intended to stay on Turbopack for dev (current `apps/brikette/package.json` dev script).
  - Shared packages should remain single-source; app-local copies are transitional only.

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/package.json` - Brikette bundler contract (`dev` vs `build` scripts).
- `scripts/check-next-webpack-flag.mjs` - repo policy gate for `next dev/build`.
- `scripts/git-hooks/pre-commit.sh` - local enforcement path (`--staged` policy check).
- `.github/workflows/merge-gate.yml` - CI enforcement path (`--all` policy check).
- `.github/workflows/brikette.yml` - deployment build path still pinned to webpack.

### Key Modules / Files
- `apps/brikette/src/guides/slugs/urls.ts` - now imports app-local `createGuideUrlHelpers`.
- `apps/brikette/src/guides/slugs/url-helpers.ts` - local copy of shared helper logic.
- `packages/guides-core/src/index.ts` - canonical shared `createGuideUrlHelpers` implementation.
- `packages/next-config/next.config.mjs` - shared webpack alias contract includes `@acme/i18n` dist alias.
- `packages/i18n/package.json` - explicit `./dist/index.js` export compatibility entry.
- `apps/brikette/next.config.mjs` - Turbopack alias currently only `@`; webpack fallbacks remain webpack-only.
- `scripts/check-next-webpack-flag.mjs` - hard-fails any `next dev/build` segment missing `--webpack`.
- `scripts/__tests__/next-webpack-flag-policy.test.ts` - codifies webpack-only policy expectations.
- `scripts/git-hooks/pre-commit.sh` - calls policy checker before lint/typecheck.
- `scripts/validate-changes.sh` - also runs policy checker for staged/range validation.

### Patterns & Conventions Observed
- Shared utility duplication in app space:
  - `apps/brikette/src/guides/slugs/url-helpers.ts` currently duplicates `createGuideUrlHelpers` from `packages/guides-core/src/index.ts`; function-region compare is byte-for-byte identical in current workspace (`cmp` exit 0, matching SHA1).
  - Divergence status: no post-fork divergence evidence yet in commit history because `apps/brikette/src/guides/slugs/url-helpers.ts` is new in this workspace state.
- Repo-level policy drift:
  - Brikette dev script is Turbopack (`apps/brikette/package.json`), while policy checker still mandates webpack for all `next dev/build` invocations (`scripts/check-next-webpack-flag.mjs`).
- Enforcement fan-out:
  - Same policy enforced in local hooks (`scripts/git-hooks/pre-commit.sh`), range validation (`scripts/validate-changes.sh`), and CI merge gate (`.github/workflows/merge-gate.yml`).
- Mixed bundler posture:
  - Dev = Turbopack, deploy build = webpack (`.github/workflows/brikette.yml`).
- i18n compatibility signaling:
  - Shared config comment indicates template-app breaks without `@acme/i18n` dist alias (`packages/next-config/next.config.mjs`).
  - `packages/i18n/package.json` exposes `./dist/index.js` explicitly.

### Data & Contracts
- Types/schemas/events:
  - No runtime schema migration required; issues are build/runtime policy contracts.
- API/contracts:
  - Operational script contract: `check-next-webpack-flag` treats missing `--webpack` as policy violation.
  - Git hook contract: pre-commit always runs policy check before other checks.
  - CI gate contract: merge gate always runs `node scripts/check-next-webpack-flag.mjs --all`.
  - Workspace resolution contract (shared config): `@acme/i18n` alias points to dist path in webpack config.

### Dependency & Impact Map
- Upstream dependencies:
  - Next.js 16 default dev bundler behavior.
  - Shared next config consumed by multiple apps.
  - Repo hook and CI policy scripts.
- Downstream dependents:
  - Brikette local commits/pushes (blocked by policy mismatch when `package.json` changes are staged).
  - PR merge gate (fails when policy script sees Turbopack dev script).
  - Template-app build stability (depends on current i18n alias behavior).
  - Guides URL resolution behavior in Brikette routes.
- Likely blast radius:
  - Infra-wide if policy checker is changed incorrectly.
  - Brikette route/link generation if helper dedupe is done unsafely.
  - Template-app and other webpack consumers if i18n alias contract changes without validation.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest for package/script tests.
- Commands executed for this fact-find:
  - `pnpm --filter @acme/guides-core test -- createGuideUrlHelpers.test.ts`
  - `pnpm exec jest --runInBand scripts/__tests__/next-webpack-flag-policy.test.ts`
  - `node scripts/check-next-webpack-flag.mjs --all`
- CI integration:
  - Merge gate invokes `node scripts/check-next-webpack-flag.mjs --all`.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Shared guide URL helper | Unit | `packages/guides-core/__tests__/createGuideUrlHelpers.test.ts` | Verified pass; covers helper behavior in shared package only |
| Webpack policy checker | Unit | `scripts/__tests__/next-webpack-flag-policy.test.ts` | Verified pass; asserts webpack-only policy |
| Repo policy real-world check | Script gate | `scripts/check-next-webpack-flag.mjs` | Verified fail against current Brikette dev script (`next dev` without `--webpack`) |

#### Coverage Gaps
- Untested paths:
  - No automated parity test between app-local `url-helpers.ts` and `packages/guides-core` helper.
  - No CI smoke test for Brikette Turbopack `next dev` route render (`/en/apartment`, `/en/help`, `/en/breakfast-menu`).
  - No regression test that validates intended mixed policy (`dev` may vary by app; `build` may stay webpack) once policy script is changed.
- Extinct tests:
  - `scripts/__tests__/next-webpack-flag-policy.test.ts` encodes global webpack-only assumptions that are now partially outdated for Brikette dev.

#### Testability Assessment
- Easy to test:
  - Policy-script behavior with fixture package/workflow files.
  - Helper parity through shared fixtures/snapshot test vectors.
- Hard to test:
  - End-to-end Turbopack runtime stability in CI without increasing job time/flakiness.
- Test seams needed:
  - App-aware policy matrix fixture (per app, per command: `dev` vs `build`).
  - Fast route-level smoke harness for Turbopack dev server startup/readiness.

### Recent Git History (Targeted)
- `5e27a4655c` - added `--webpack` to dev/build during Next 16 upgrade (`apps/brikette/package.json` history).
- Current workspace state - Brikette dev script changed to Turbopack (`apps/brikette/package.json`), creating conflict with existing repo policy checker.
- `98f42ad762` - recent CI/quality-matrix fixes touched shared config area (`packages/next-config/next.config.mjs` in scope).
- `40381e9201` - current webpack-policy checker/test lineage (`scripts/check-next-webpack-flag.mjs`, `scripts/__tests__/next-webpack-flag-policy.test.ts`).

## Questions
### Resolved
- Q: Is helper duplication real or only conceptual?
  - A: Real. Brikette now carries a local copy of `createGuideUrlHelpers`.
  - Evidence: `apps/brikette/src/guides/slugs/url-helpers.ts`; `packages/guides-core/src/index.ts`; direct `diff -u`.

- Q: Is webpack-only policy still actively enforced?
  - A: Yes, at pre-commit, validate-changes, and merge gate.
  - Evidence: `scripts/git-hooks/pre-commit.sh`; `scripts/validate-changes.sh`; `.github/workflows/merge-gate.yml`.

- Q: Does current repo state violate that policy?
  - A: Yes. `node scripts/check-next-webpack-flag.mjs --all` fails on `apps/brikette/package.json` dev script.
  - Evidence: local command output from this fact-find run.

- Q: Is CI currently validating Turbopack dev startup for Brikette?
  - A: No dedicated Turbopack `next dev` smoke job found.
  - Evidence: `.github/workflows/brikette.yml`; `.github/workflows/reusable-app.yml`; workflow search for `next dev`.

- Q: Is removing the shared webpack `@acme/i18n` dist alias in-scope for this hardening pass?
  - A: No. This pass scopes i18n as explicit follow-up debt to avoid coupling policy/helper hardening with multi-app webpack alias changes.
  - Evidence: scope/non-goal in this brief; existing alias contract in `packages/next-config/next.config.mjs`.

### Open (User Input Needed)
- Q: Should repo policy become app-aware (allow Brikette dev Turbopack) or return Brikette dev to webpack until full repo policy migration?
  - Why it matters: decides whether policy scripts are updated or Turbopack migration is effectively rolled back.
  - Decision impacted: first implementation task ordering and acceptance criteria.
  - Decision owner: Peter (repo owner).
  - Default assumption + risk: assume app-aware policy; risk is accidental weakening of safeguards for other apps.

- Q: Should `createGuideUrlHelpers` be extracted into a dedicated browser-safe export in `guides-core`, or should Brikette keep a local copy with sync checks?
  - Why it matters: determines long-term ownership and drift prevention.
  - Decision impacted: helper dedupe implementation design.
  - Decision owner: platform/frontend maintainer.
  - Default assumption + risk: assume shared extraction; risk is reintroducing Node-only import edges if export boundaries are not clean.


## Confidence Inputs
- Implementation: 83%
  - Evidence basis: concrete files, failing/passing gate commands, and exact enforcement points are identified.
  - To >=80: already met.
  - To >=90: settle policy-direction decision (app-aware vs rollback) before planning task decomposition.

- Approach: 82%
  - Evidence basis: technical fixes are clear; policy direction default (app-aware policy) and i18n boundary (deferred follow-up) are now explicit in-scope decisions.
  - To >=80: already met.
  - To >=90: pre-agree helper extraction target surface in `guides-core` and CI smoke runtime budget.

- Impact: 88%
  - Evidence basis: current policy mismatch can block commits/merge; helper duplication and missing CI smoke increase regression risk.
  - To >=80: already met.
  - To >=90: add explicit failure examples from CI or hook runs in plan execution evidence.

- Delivery-Readiness: 82%
  - Evidence basis: planning can proceed with explicit defaults (app-aware policy, i18n deferred) and concrete task seeds.
  - To >=80: already met.
  - To >=90: lock CI smoke SLA (timeouts/budget) and helper extraction acceptance tests before implementation starts.

- Testability: 82%
  - Evidence basis: existing test harnesses already exist for policy script and shared helper; new seams are straightforward.
  - To >=80: already met.
  - To >=90: codify deterministic Turbopack smoke harness (`/en/apartment`, `/en/help`, `/en/breakfast-menu`; readiness timeout 45s; per-route timeout 30s; workflow step budget 8m).

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Policy checker weakened too broadly while allowing Brikette Turbopack dev | Medium | High | Replace binary rule with explicit policy matrix + tests per app/command |
| Keeping helper duplicated causes silent logic drift | Medium | Medium | Move helper ownership to shared package; add parity contract tests until dedupe lands |
| Attempting i18n alias removal in same pass breaks template-app | Medium | High | Gate with per-app build validations and scoped rollout |
| CI Turbopack smoke adds flakiness/time | Medium | Medium | Use fixed route set (`/en/apartment`, `/en/help`, `/en/breakfast-menu`) with readiness timeout 45s, per-route timeout 30s, step budget 8m |
| Mixed bundler docs remain inconsistent | Medium | Medium | Update policy/docs/hook guidance in same change set |

## Planning Constraints & Notes
- Must-follow patterns:
  - Do not bypass hooks/merge gate; update policy logic and tests together.
  - Keep production build behavior unchanged unless explicitly scoped.
  - Eliminate duplication via shared ownership, not manual periodic copy.
- Rollout/rollback expectations:
  - Rollout in phases: policy matrix + tests first, then helper dedupe, then optional i18n cleanup.
  - Rollback by restoring previous policy script behavior if gate instability appears.
- Observability expectations:
  - Track hook/merge-gate pass rates after policy update.
  - Record Turbopack smoke timing baseline and failures.

## Suggested Task Seeds (Non-binding)
1. Replace `check-next-webpack-flag` global rule with an explicit app/command policy matrix, update script error text, and update its Jest suite in the same task.
2. Docs-only alignment task: update `docs/git-hooks.md` and workflow step labels/descriptions to reflect the revised policy contract (no policy-logic changes).
3. Extract browser-safe `createGuideUrlHelpers` export from `guides-core` and migrate Brikette off local copy.
4. Add parity regression test coverage for helper behavior during migration (shared fixture cases) and retire parity test once dedupe is complete.
5. Add Brikette Turbopack dev smoke validation in CI with concrete harness spec:
   - routes: `/en/apartment`, `/en/help`, `/en/breakfast-menu`
   - readiness timeout: 45s
   - per-route HTTP/assert timeout: 30s
   - workflow step budget: 8 minutes
6. Follow-up backlog item (out-of-scope for this pass): evaluate retirement path for shared webpack `@acme/i18n` dist alias with matrixed app build validation.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Policy checker and tests align with intended mixed bundler posture.
  - Brikette no longer carries duplicated guide URL helper logic.
  - CI includes at least one deterministic Turbopack dev smoke path for Brikette.
  - Build validations remain green for Brikette, template-app, and business-os.
- Post-delivery measurement plan:
  - Monitor pre-commit and merge-gate failure reasons for policy false positives.
  - Track Turbopack smoke duration and flake rate for two weeks.

## Evidence Gap Review
### Gaps Addressed
- Verified key tests instead of listing only:
  - `packages/guides-core` helper test pass.
  - webpack policy checker test pass.
- Verified live policy conflict with direct command:
  - `node scripts/check-next-webpack-flag.mjs --all` fails on Brikette dev script.
- Verified CI/workflow surfaces that enforce/consume current policy.

### Confidence Adjustments
- Raised approach and delivery-readiness above 80 after locking explicit defaults (app-aware policy; i18n deferred follow-up).
- Kept implementation/testability above 80 because evidence and test seams are concrete and verified by targeted test/script runs.

### Remaining Assumptions
- Brikette Turbopack dev remains desired long-term.
- Production webpack build remains intentionally unchanged for now.
- i18n alias cleanup can be sequenced after policy + helper hardening if needed.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - none (decision defaults are explicit in this brief)
- Recommended next step:
  - `/lp-do-plan docs/plans/archive/turbopack-post-migration-hardening-archived-2026-02-20/fact-find.md`
