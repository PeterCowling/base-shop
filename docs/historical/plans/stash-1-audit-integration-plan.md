---
Type: Plan
Status: Completed
Domain: Repo
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
Completed: 2026-01-16
Completed-by: Codex
Last-reviewed: 2026-01-16
Relates-to charter: AGENTS.md
---

# Plan: Audit + Selectively Integrate stash@{1}

## Goal
Safely audit `stash@{1}` and selectively integrate only the changes that are clear improvements, while excluding generated artifacts and any unrelated or risky edits.

## Scope
- Review `stash@{1}` contents against current `HEAD`.
- Classify files into: eligible source/doc changes, generated outputs, and unrelated/unwanted changes.
- Manually apply selected changes (no stash pop).
- Validate with targeted checks and keep PR green.

## Non-goals
- Broadly applying the stash wholesale.
- Restoring or committing generated artifacts (`apps/prime/out/**`, `apps/storybook/storybook-static/**`, `node_modules`, `.eslintcache`).
- Using `git stash pop` or `git stash drop` as part of the integration workflow.

## Constraints
- Follow `AGENTS.md` git safety rules and testing policy.
- Prefer manual, scoped application of changes rather than applying the stash.
- Any change affecting 10+ files must be justified and tracked in this plan.

## Active Tasks
- [x] REPO-1: Inventory and classify stash@{1} contents
  - Scope: Use `git stash show --name-only stash@{1}` and targeted diffs to build a categorized list (eligible vs generated vs ignore).
  - Dependencies: stash exists locally.
  - Definition of done: A short inventory table in this plan listing candidate paths and exclusions.

- [x] REPO-2: Decide what to integrate
  - Scope: For each candidate file, compare `stash@{1}` against `HEAD` and decide include/exclude with rationale.
  - Dependencies: REPO-1.
  - Definition of done: A decision list (include/exclude + reason) captured in this plan.
  - Progress: Docs/config, apps/cms, apps/dashboard/shop-bcd, packages/ui, packages/platform-core, packages shared (design-tokens/i18n/themes/types/tailwind-config/email/lib/platform-machine), and tests/data decisions captured below.

- [x] REPO-3: Manually apply approved changes
  - Scope: Recreate approved edits via focused patches; avoid `git stash pop`. Keep changes minimal and on the current `work/*` branch.
  - Dependencies: REPO-2.
  - Definition of done: Only approved files changed; no generated outputs added; changes committed with attribution.

- [x] REPO-4: Validate and push
  - Scope: Run targeted lint/tests per touched packages; push updates and confirm CI is green.
  - Dependencies: REPO-3.
  - Definition of done: CI green on the PR branch; user notified with summary and any remaining warnings.

## Inventory (REPO-1)
| Category | Paths | Notes |
| --- | --- | --- |
| Generated / ignore | `cypress/screenshots/**/*.png` | Failed test artifacts; do not restore. |
| Docs / config | `README.md`, `eslint.config.mjs`, `jest.coverage.cjs`, `jest.setup.ts`, `middleware.ts`, `package.json`, `cypress.config.ts` | Potential repo-wide behavior changes; require diff review. |
| App code (CMS) | `apps/cms/**` | Large surface area: layouts, configurator, themes, wizard, API route, styles. |
| App code (dashboard/shop) | `apps/dashboard/**`, `apps/shop-bcd/**` | UI styles and layout changes. |
| Packages (core) | `packages/design-tokens/**`, `packages/i18n/**`, `packages/platform-core/**`, `packages/platform-machine/**`, `packages/tailwind-config/**`, `packages/themes/**`, `packages/types/**` | Includes token outputs and platform logic. |
| Packages (UI) | `packages/ui/**` | Broad UI and CMS page builder updates plus component tests. |
| Tests / fixtures | `__tests__/data/shops/abc/**` (deleted), `packages/**/__tests__/**`, `apps/cms/**/__tests__/**`, `cypress/support/component.ts`, `test/msw/shared.ts` | Mixed edits and deletions; review intent before adopting. |
| Data files | `data/**` | Configurator progress and shop data; may be fixtures or runtime data. |

## Decisions (REPO-2)
### Docs/config bucket
| Path | Decision | Rationale |
| --- | --- | --- |
| `README.md` | Exclude | Stash removes newer repo guidance (agent setup, linting, monorepo structure); looks older than `HEAD`. |
| `eslint.config.mjs` | Exclude | Stash drops a11y/testing/storybook/tailwind rules and token enforcement; would regress lint coverage. |
| `jest.setup.ts` | Exclude | Stash removes test polyfills/mocks (Browserslist suppression, Next navigation, i18n fallback); likely to reintroduce test failures. |
| `middleware.ts` | Exclude (for now) | Stash adds CSP nonce/GA + helmet headers; high-risk behavior change and likely a reverted experiment. Needs explicit product/security sign-off before reintroducing. |
| `package.json` | Exclude | Stash removes newer scripts, lint exceptions, hooks, and updated storybook/CI commands; appears behind `HEAD`. |
| `cypress.config.ts` | Exclude | Stash reintroduces large root config; current repo intentionally re-exports app config. |
| `jest.coverage.cjs` | No change | No diff vs `HEAD`; nothing to apply. |

### apps/cms bucket
| Path | Decision | Rationale |
| --- | --- | --- |
| `apps/cms/**` | Exclude | Stash removes large portions of CMS features and test suites (including most Cypress coverage) and simplifies configurator steps (drops i18n-driven metadata). Sample diffs show significant deletions, indicating an older snapshot or rollback. |

### packages/ui bucket
| Path | Decision | Rationale |
| --- | --- | --- |
| `packages/ui/**` | Exclude | Stash deletes a large portion of UI components, stories, and tests and simplifies primitives (e.g., button sizes/iconOnly removed). Net effect is major functionality loss, so it is likely older and not an improvement. |

### packages/platform-core bucket
| Path | Decision | Rationale |
| --- | --- | --- |
| `packages/platform-core/**` | Exclude | Stash removes cart lifecycle, inventory holds, stripe webhook coverage, and many repository features plus migrations. The size of deletions suggests a downgrade and not an enhancement. |

### apps/dashboard + apps/shop-bcd bucket
| Path | Decision | Rationale |
| --- | --- | --- |
| `apps/dashboard/**` | Exclude | Stash deletes major dashboard pages and tests (large net removals), suggesting an older snapshot or rollback rather than improvements. |
| `apps/shop-bcd/**` | Exclude | Stash introduces a very large set of new tests/routes/pages (185 files). This is too broad to merge from a stash and likely diverges from current app direction; needs a dedicated plan if still desired. |

### packages shared bucket
| Path | Decision | Rationale |
| --- | --- | --- |
| `packages/design-tokens/**` | Exclude | Stash removes docs, token contexts, and plugin code; large deletions indicate regression. |
| `packages/i18n/**` | Exclude | Stash drops locales and translation tooling; would reduce language coverage and tooling. |
| `packages/email/**` | Exclude | Stash replaces large test suites and deletes analytics/provider coverage; likely a rollback. |
| `packages/lib/**` | Exclude | Stash deletes large portions of tests and try-on providers; not safe to restore without context. |
| `packages/platform-machine/**` | Exclude | Stash removes maintenance/release service logic and many tests; suggests downgrade. |
| `packages/themes/**` | Exclude | Stash removes theme packages and token assets; looks like a rollback. |
| `packages/types/**` | Exclude | Stash removes large portions of type schemas and docs; high regression risk. |
| `packages/tailwind-config/**` | Exclude | Stash removes README and plugin logic and changes config/tests; appears older. |

### tests/data bucket
| Path | Decision | Rationale |
| --- | --- | --- |
| `__tests__/data/**` | Exclude | Large fixture rewrites and deletions across shops; likely environment-specific or outdated. |
| `cypress/support/component.ts` | Exclude | Stash reintroduces large root support file; current setup uses app-scoped Cypress config. |
| `data/**` | Exclude | Major data set reshuffles (thousands of lines) and deletions; unsafe to import from stash. |
| `test/msw/shared.ts` | Exclude | Changes coupled to test data rewrites; not safe without a dedicated test plan. |

## Risks / Notes
- The stash appears to include large generated output and mixed changes across multiple apps; careless application could regress unrelated areas.
- Integration must remain selective, auditable, and reversible.

## Completion Summary
- Reviewed all stash buckets; all changes excluded due to regression risk or excessive scope.
- No stash changes applied; repo remains on current `HEAD` behavior.
