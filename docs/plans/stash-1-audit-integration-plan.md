---
Type: Plan
Status: Active
Domain: Repo
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
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

- [ ] REPO-2: Decide what to integrate
  - Scope: For each candidate file, compare `stash@{1}` against `HEAD` and decide include/exclude with rationale.
  - Dependencies: REPO-1.
  - Definition of done: A decision list (include/exclude + reason) captured in this plan.
  - Progress: Docs/config bucket decisions captured below; remaining buckets pending.

- [ ] REPO-3: Manually apply approved changes
  - Scope: Recreate approved edits via focused patches; avoid `git stash pop`. Keep changes minimal and on the current `work/*` branch.
  - Dependencies: REPO-2.
  - Definition of done: Only approved files changed; no generated outputs added; changes committed with attribution.

- [ ] REPO-4: Validate and push
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

## Risks / Notes
- The stash appears to include large generated output and mixed changes across multiple apps; careless application could regress unrelated areas.
- Integration must remain selective, auditable, and reversible.
