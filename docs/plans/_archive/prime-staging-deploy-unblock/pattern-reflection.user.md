---
Type: Pattern-Reflection
Feature-Slug: prime-staging-deploy-unblock
Date: 2026-02-28
---

# Pattern Reflection

## Patterns

1. **Test files for components using `useTranslation()` need a `react-i18next` mock** | Category: repeatable rule | Routing: add to test scaffolding checklist | Observed: 2 times (token-routing.test.tsx, find-my-stay/__tests__/page.test.tsx in this build; existing pattern in chat test files shows the correct form). Without the mock, React concurrent rendering warnings cause test failures in the jest.setup.ts console-trap environment.

2. **Changed-file lint gate is stricter than full-suite lint** | Category: access gap (discovered mid-build) | Routing: note in prime development guide | Observed: 1 time. `prime-lint-changed-files.ts` runs `--max-warnings=0`; `pnpm lint` allows warnings. Components with warning-level violations locally still fail the CI gate. Discovery happened after first CI run failed.

## Access Declarations

None
