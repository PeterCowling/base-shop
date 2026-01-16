---
Type: Plan
Status: Active
Domain: Runtime
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
---

# Plan: Prime Lint Remediation

## Background
Root CI fails in the Lint step because `@apps/prime` reports hundreds of lint errors (334 errors, 190 warnings). The failures include unused imports/vars, missing eslint-disable justifications, raw colors, explicit `any`, and hardcoded copy warnings. This is a large, cross-file cleanup that needs structured remediation.

## Goals
- Bring `@apps/prime` lint to green without disabling checks.
- Resolve unused variable/import errors and incorrect eslint-disable directives.
- Replace raw colors with DS tokens and remove `any` types where possible.
- Address hardcoded copy violations (move to i18n or add documented exemptions).

## Non-Goals
- Disabling lint rules or skipping `@apps/prime` in CI.
- Refactoring Prime beyond what is required for lint compliance.

## Scope
- `apps/prime/**`
- Lint rules enforced by `pnpm --filter @apps/prime lint`

## Known CI Findings (examples)
- `apps/prime/src/lib/pwa/useOnlineStatus.ts`: unused `useCallback` import.
- `apps/prime/src/lib/quests/computeQuestState.ts`: unused `getNextTierId`.
- `apps/prime/src/lib/quests/initializeQuestProgress.ts`: unused `QUEST_RELEVANT_TASKS`.
- `apps/prime/src/services/firebase.ts`: eslint-disable without ticket justification.
- `apps/prime/src/services/firebaseMetrics.ts`: `any` usage and raw color `#4CAF50`.
- `apps/prime/src/test-utils/firebase-mock.ts`: unused parameters.
- `apps/prime/src/test-utils/useFirebase-mock.ts`: unused `jest` import and `createMockSnapshot`.

## Approach
1. Run targeted lint locally to capture the full error list:
   - `pnpm --filter @apps/prime lint`
2. Categorize errors by rule and file group:
   - Unused vars/imports (`@typescript-eslint/no-unused-vars`)
   - Missing eslint-disable justification (`ds/require-disable-justification`)
   - Raw colors (`ds/no-raw-color`)
   - Explicit `any` (`@typescript-eslint/no-explicit-any`)
   - Hardcoded copy (`ds/no-hardcoded-copy`)
3. Fix by category:
   - Remove unused imports/vars or prefix with `_` if required by signature.
   - Add ticketed justifications to eslint-disable directives or remove unused disables.
   - Replace raw colors with DS token utilities (e.g., `text-danger`, `bg-success`).
   - Replace `any` with explicit interfaces/types for Firebase metrics payloads.
   - Move copy into `packages/i18n/src/en.json` or add `i18n-exempt` with ticket.
4. Re-run targeted lint and ensure `pnpm lint` passes.

## Open Questions
- What ticket ID should be used for required eslint-disable and i18n-exempt justifications?
- Should we address all hardcoded-copy warnings now, or only errors blocking CI?

## Tasks
1. Run `pnpm --filter @apps/prime lint` and capture a full error inventory.
2. Fix unused imports/vars in Prime modules and test utilities.
3. Update eslint-disable directives with ticketed justifications.
4. Replace raw color usage with DS token classes or CSS variables.
5. Replace `any` usage with typed interfaces where possible.
6. Address hardcoded copy (i18n or documented exemptions).
7. Re-run targeted lint and confirm Root CI passes.

## Acceptance Criteria
- `pnpm --filter @apps/prime lint` returns zero errors.
- Root CI `verify` job passes on the work branch.

## Risks and Mitigations
- Risk: Broad changes touch many files and introduce regressions.
  - Mitigation: Fix by category and re-run lint after each batch.
- Risk: Missing ticket IDs blocks eslint-disable/i18n-exempt requirements.
  - Mitigation: Confirm the ticket prefix/IDs before updating directives.
