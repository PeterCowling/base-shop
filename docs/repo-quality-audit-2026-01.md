---
Type: Audit
Status: Active
Domain: Repo
Created: 2026-01-16
Created-by: Claude Opus 4.5
Last-updated: 2026-01-16
Last-updated-by: Codex
---

# Repository Quality Audit — January 2026

This audit summarizes the current state of architecture, tooling, and delivery practices in the base-shop repository. It highlights strengths, gaps, and a prioritized remediation list.

## Executive Summary

**Overall Grade: B+** *(upgraded from B-)*

The repository has made significant improvements in January 2026, particularly in testing infrastructure (Jest presets, visual regression), CI/CD coverage (23 workflows), security (Next.js 15.3.8), and documentation (plan lifecycle, templates). Remaining gaps focus on Turbo remote caching, post-deployment validation, and Design System documentation consolidation.

### Top Risks (P0)
- ~~Next.js RCE exposure pending dependency upgrade~~ **RESOLVED** (15.3.8)
- SSRF risk in webhook forwarding *(mitigated via settings validation, explicit URL validation recommended)*
- Cross-shop authorization gaps in CMS APIs *(needs formal audit)*
- Secrets exposed in git history (needs rotation + history rewrite)

### Quick Reference

| Category | Grade | Key Strength | Key Gap |
|----------|-------|--------------|---------|
| Monorepo/Build | A | Turborepo + pnpm workspaces | No Turbo remote cache |
| TypeScript | A- | Strict mode + project references | Dual alias patterns undocumented |
| Code Quality | A | Custom ESLint DS plugin (33 rules) | No DS rule documentation |
| Testing | A- | Jest presets, Chromatic visual regression | Root config refactoring incomplete |
| CI/CD | A- | 23 workflows, reusable templates | No post-deploy validation |
| Git Safety | A+ | Multi-layer protection | None observed |
| Documentation | A- | 233 docs, plan templates, metadata lifecycle | No unified DS handbook |
| Design System | B+ | Multi-context tokens, lint enforcement | No API standard, no handbook |
| Security | B | Next.js 15.3.8, Zod, Argon2, weekly audits | SSRF needs explicit validation, auth audit needed |
| Developer Experience | A- | 123 scripts, good IDE support, 34 READMEs | Dependency graph missing |

## Scope and Method

- Focus: repo-level architecture, tooling, CI/CD, documentation, design system, and security posture.
- Security findings are sourced from `docs/security-audit-2026-01.md`.
- Audience: agents only. Documentation recommendations prioritize machine-readable, task-oriented context and avoid human onboarding assumptions.
- This is a repository health audit, not a full penetration or production performance review.

## Detailed Assessment

### A. Monorepo Structure & Build System — Grade: A *(upgraded from A-)*

**Strengths**
- Turborepo configured with task dependencies (`^build`), caching, and outputs.
- pnpm workspaces across 31 apps + 31 packages with workspace protocols.
- Clear separation between `apps/` and `packages/`.
- **NEW:** 34 READMEs across packages and apps (25 in packages/, 9 in apps/).
- **NEW:** Package agent brief template available at `docs/templates/package-agent-brief.md`.

**Gaps**
- 40+ path aliases in `tsconfig.base.json` (reduced from 63, but still includes some duplicates like `@acme/ui` and `@ui`).
- No Turbo remote cache configured for CI acceleration.
- Build scripts vary widely (`tsc -b`, `tsc -b && tsup`, custom scripts).
- Package naming collisions create confusion (`templates` vs `template-app`, `configurator` vs `product-configurator`).

**Recommendations**
1. Configure Turbo remote cache with `TURBO_TOKEN` for CI build acceleration.
2. Continue consolidating aliases to a canonical set.
3. Standardize build scripts via shared presets or common scripts.
4. Document naming conventions and enforce them for new packages.

### B. TypeScript Configuration — Grade: A-

**Strengths**
- Strict TypeScript enabled globally.
- Project references configured with `composite: true`.
- Incremental compilation works correctly.

**Gaps**
- Dual alias patterns exist (`@acme/platform-core` and `@platform-core`), with no canonical guidance.
- Some packages export from `src/` instead of `dist/`, creating inconsistent consumption patterns.

**Recommendations**
1. Declare a single canonical alias pattern and document it in `docs/tsconfig-paths.md`.
2. Align package exports to `dist/` for published outputs; keep `src/` for tooling only.

### C. Code Quality & Linting — Grade: A

**Strengths**
- Custom ESLint plugin (`@acme/eslint-plugin-ds`) with 33 rules enforcing tokens, layout, and accessibility.
- `eslint-plugin-boundaries` enforces layer boundaries.
- Prettier configuration is comprehensive with Tailwind integration.

**Key DS Rules (representative)**
| Category | Rules |
|----------|-------|
| Token Enforcement | `no-raw-color`, `no-raw-spacing`, `no-raw-radius`, `no-raw-shadow`, `no-raw-typography` |
| Layer Boundaries | `no-margins-on-atoms`, `enforce-layout-primitives`, `absolute-parent-guard` |
| Accessibility | `min-tap-size`, `enforce-focus-ring-token`, `no-misused-sr-only`, `icon-button-size` |
| Responsive | `require-breakpoint-modifiers`, `container-widths-only-at` |
| RTL/i18n | `no-physical-direction-classes-in-rtl`, `no-hardcoded-copy` |

**Gaps**
- No documentation explaining the purpose and escape hatches for DS rules.
- Some apps still carry migration warnings (acceptable but undocumented).

**Recommendations**
1. Document each DS rule with rationale and examples.
2. Track migration warnings as a backlog with owners and dates.

### D. Testing Infrastructure — Grade: A- *(upgraded from B)*

**Strengths**
- Multi-level testing (unit → integration → E2E).
- MSW integration for API mocking.
- Coverage thresholds defined per package (80% global, 90% for `@acme/ui`).
- Cypress smoke suite and accessibility testing via `jest-axe`.
- **NEW:** Jest preset system fully implemented in `packages/config/jest-presets/` with 5 coverage tiers (strict/standard/moderate/relaxed/minimal).
- **NEW:** 13+ packages/apps migrated to new Jest presets with rollback support via `JEST_USE_NEW_PRESET` env var.
- **NEW:** Chromatic visual regression testing configured in `.github/workflows/storybook.yml`.
- **NEW:** Storybook test runner with Playwright-based visual testing.
- **NEW:** Story coverage verification via `pnpm stories:verify`.

**Gaps**
- Root Jest config still 271 lines with hard-coded app detection; Phase 5 refactoring deferred.
- Coverage thresholds not enforced as CI gate (defined but not blocking).
- E2E ownership is fragmented (root CI, cypress.yml, and app workflows).

**Recommendations**
1. Complete Phase 5 of Jest preset consolidation (remove hard-coded app detection from root config).
2. Add CI gate to fail PRs on coverage regression.
3. Consolidate E2E ownership and entry points.

### E. CI/CD & Deployment — Grade: A- *(upgraded from B)*

**Recent Improvements (January 2026)**
- Root CI release job now includes setup, build, and deploy steps.
- Staging environment configured at `https://staging.base-shop.pages.dev`.
- App workflows (reception, product-pipeline) include staging/production/validate jobs.
- Redundant `reception-ci.yml` removed.
- Lint steps consolidated with explicit exception governance.
- **NEW:** 23 GitHub workflow files now in `.github/workflows/`.
- **NEW:** ESLint cache configuration with fallback keys in CI.

**Current Workflow Architecture**
- Root CI (`.github/workflows/ci.yml`): verify (lint/typecheck/tests/build) + release (main only, deploy to staging).
- App workflows (e.g., `reception.yml`, `product-pipeline.yml`): staging on `main`, production via manual dispatch, validate on PRs.

**App Workflow Coverage** (all major apps now covered):
| App | Workflow |
|-----|----------|
| cms | cms.yml |
| skylar | skylar.yml |
| reception | reception.yml |
| cover-me-pretty | cover-me-pretty.yml |
| brikette | brikette.yml |
| prime | prime.yml |
| cochlearfit | cochlearfit.yml |
| handbag-configurator | handbag-configurator.yml |
| xa, xa-b, xa-j | xa.yml, xa-b.yml, xa-j.yml |
| product-pipeline | product-pipeline.yml |

**Gaps**
- No post-deployment validation/health checks.
- No Turbo remote cache; every job rebuilds.
- Path filters are manually maintained and drift-prone.

**Recommendations**
1. Add post-deploy health checks (e.g., curl + status check) to reusable-app.yml.
2. Configure Turbo remote cache with `TURBO_TOKEN`.
3. Consider automated path filter generation.

### F. Git Safety & Incident Prevention — Grade: A+

**Strengths**
- Multi-layer protection across documentation, hooks, GitHub rules, and Claude Code hooks.
- Incident-driven recovery plan and institutional knowledge.
- Safety tooling actively enforced and documented.

**Gaps**
- None observed. This is best-in-class.

### G. Documentation — Grade: A- *(upgraded from B+)*

**Strengths**
- **NEW:** 233 documentation files (up from 215+).
- Exceptional AI-agent documentation (`CLAUDE.md`, `AGENTS.md`, `INDEX_FOR_CLAUDE`).
- Solid operational guides that can be adapted into agent runbooks (`install.md`, `setup.md`, `contributing.md`).
- **NEW:** Package agent brief template at `docs/templates/package-agent-brief.md`.
- **NEW:** Plan documentation lifecycle fully implemented with metadata headers (Type, Status, Domain, Created-by, etc.).
- **NEW:** Historical archive structure at `docs/historical/plans/` with 5+ archived plans.
- **NEW:** 34 READMEs across packages and apps (25 in packages/, 9 in apps/).

**Gaps**
- No unified Design System Handbook (documentation scattered across `ui-system-phase*.md` files).
- No dependency graph documentation (package import boundaries are implicit).
- No package architecture guide (when to create a package vs a folder).
- Some docs still use human-first tone rather than agent-runbook style.

**Recommendations**
1. Consolidate scattered DS docs into a unified Design System Handbook.
2. Document package layers and import boundaries (diagram + text).
3. Add a short guide for "package vs folder" decisions.
4. Continue converting human-first docs into agent-runbook style.

### H. Design System & UI — Grade: B+

**Strengths**
- Multi-context token system (consumer/hospitality/operations).
- Strong ESLint enforcement of design patterns (33 rules).
- Atomic component library (atoms → molecules → organisms).
- shadcn/Radix integration is pragmatic.

**Gaps**
- No component API standardization; props vary across components.
- No Design System Handbook.
- No visual regression testing.
- Accessibility lacks a comprehensive audit plan.
- Theming limited to light/dark (no multi-brand support).

**Recommendations**
1. Standardize component prop conventions (naming, sizing, variant patterns).
2. Publish a Design System Handbook (see Documentation section).
3. Add visual regression testing (see Testing section).
4. Run a WCAG 2.1 AA audit and track remediation.

### I. Security — Grade: B *(upgraded from C+)*

**Strengths**
- Zod validation used consistently.
- Argon2 password hashing.
- Webhook signature verification with HMAC.
- Weekly audit workflow in place.
- **NEW:** Next.js upgraded to 15.3.8 (RCE vulnerability resolved).
- **NEW:** SSRF partially mitigated via CMS settings-based endpoint validation.

**Resolved Issues**

| Severity | Issue | Status |
|----------|-------|--------|
| ~~CRITICAL~~ | Next.js RCE vulnerability | **RESOLVED** — upgraded to 15.3.8 |
| HIGH | SSRF in webhook forwarding | **MITIGATED** — endpoint from validated CMS settings (explicit URL validation recommended) |

**Remaining Gaps**

| Severity | Issue | Location |
|----------|-------|----------|
| CRITICAL | form-data unsafe random | Cypress dependency chain |
| HIGH | Missing cross-shop authorization | `apps/cms/src/app/api/data/[shop]/` routes (needs formal audit) |
| HIGH | Test auth bypass pattern | `apps/cms/src/actions/common/auth.ts` |
| MEDIUM | Secrets in git history | Historical commits (needs git-filter-repo) |
| MEDIUM | CSP gaps | Missing script-src, style-src in production |

**Recommendations**
1. Add explicit URL validation to webhook forwarding (whitelist domains, block private IPs).
2. Conduct formal cross-shop authorization audit of CMS APIs.
3. Rotate exposed secrets and clean git history.
4. Update Cypress or its dependencies to resolve form-data vulnerability.

### J. Developer Experience — Grade: A- *(upgraded from B+)*

**Strengths**
- 123 well-organized npm scripts.
- `pnpm quickstart-shop` scaffolding.
- Good IDE integration with aliases and declaration maps.
- **NEW:** 34 READMEs providing package context (25 in packages/, 9 in apps/).
- **NEW:** Agent brief template at `docs/templates/package-agent-brief.md`.
- **NEW:** Jest presets reduce per-package configuration burden.

**Gaps**
- Confusing package names and overlap (`templates` vs `template-app`).
- No dependency visualization.

**Recommendations**
1. Create a dependency graph (e.g., simple static diagram).
2. Add a naming guide and enforce it for new packages.

## Priority Fixes

### P0: Blocking (This Week)

| # | Issue | Action | Status |
|---|-------|--------|--------|
| 1 | Next.js RCE | Upgrade to 15.3.6+ | **RESOLVED** (15.3.8) |
| 2 | SSRF vulnerability | Add URL validation, block private IPs | **MITIGATED** (settings-based; explicit validation recommended) |
| 3 | Cross-shop auth | Validate shop ownership on API routes | Needs formal audit |
| 4 | Exposed secrets | Rotate secrets, run git-filter-repo | Pending |

### P1: High Priority (Next 2 Weeks)

| # | Issue | Action | Status |
|---|-------|--------|--------|
| 5 | No post-deploy validation | Add health checks after deployment | Pending |
| 6 | No Turbo cache | Configure TURBO_TOKEN for remote caching | **RESOLVED** (workflows configured; add secrets to GitHub) |
| 7 | ESLint cache misses | Fix cache key to use content hash | **RESOLVED** (fallback keys configured) |
| 8 | No visual regression | Add Chromatic or Percy | **RESOLVED** (Chromatic configured) |
| 9 | Coverage not enforced | Add CI gate for coverage drops | Pending |

### P2: Medium Priority (Next Month)

| # | Issue | Action | Status |
|---|-------|--------|--------|
| 10 | No agent package briefs | Add agent-focused README/AGENTS to all packages | **RESOLVED** (34 READMEs, template available) |
| 11 | Path alias explosion | Reduce from 63 to ~20 | **PARTIAL** (reduced to 40+) |
| 12 | No DS handbook | Create component API reference | Pending |
| 13 | Missing app workflows | Add CI/CD for remaining 15+ apps | **RESOLVED** (23 workflows, all major apps covered) |
| 14 | No dependency graph | Document package layers visually | Pending |

### P3: Quality Polish (Ongoing)

| # | Issue | Action | Status |
|---|-------|--------|--------|
| 15 | Component API inconsistency | Standardize prop naming | Pending |
| 16 | Accessibility gaps | Complete WCAG 2.1 AA audit | Pending |
| 17 | No ESLint rule docs | Document why each rule exists | Pending |
| 18 | No package guide | Document when to create vs extend | Pending |
| 19 | Root Jest config cleanup | Complete Phase 5 refactoring | **NEW** — Pending |

## Appendix: Files Referenced

### CI/CD Workflows
- `.github/workflows/ci.yml` — Root CI with verify and release jobs
- `.github/workflows/reusable-app.yml` — Reusable deployment template
- `.github/workflows/reception.yml` — Reception app (staging/production/validate)
- `.github/workflows/product-pipeline.yml` — Product pipeline app
- `.github/workflows/brikette.yml`, `skylar.yml`, `cms.yml`, `prime.yml` — Other apps

### Security
- `docs/security-audit-2026-01.md` — Detailed security findings
- `apps/cms/src/actions/common/auth.ts` — Auth patterns
- `apps/cover-me-pretty/src/app/api/leads/route.ts` — SSRF concern

### Git Safety
- `AGENTS.md` — Git safety rules (canonical)
- `CLAUDE.md` — Claude-specific guidance
- `docs/git-safety.md` — Human-readable guide
- `scripts/git-hooks/pre-push-safety.sh` — Force push blocking

### Testing
- `jest.config.cjs` — Root Jest configuration (271 lines)
- `packages/config/jest-presets/` — Jest preset system (base, react, node, coverage-tiers)
- `packages/config/jest-presets/README.md` — Jest preset documentation
- `apps/cms/cypress.config.mjs` — Cypress E2E configuration
- `docs/coverage.md` — Coverage targets
- `.github/workflows/storybook.yml` — Chromatic visual regression workflow

### Design System
- `packages/ui/` — Component library
- `packages/design-tokens/` — Token definitions
- `packages/eslint-plugin-ds/` — Custom ESLint rules

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-16 | Claude Opus 4.5 | Initial comprehensive audit |
| 2026-01-16 | Codex | Restructured for clarity, consistency, and actionability |
| 2026-01-16 | Codex | Reframed documentation guidance for agent-only readership |
| 2026-01-16 | Codex | Linked the agent-focused package doc template |
| 2026-01-16 | Claude Opus 4.5 | Updated grades based on January improvements: Testing B→A-, CI/CD B→A-, Documentation B+→A-, Security C+→B, Monorepo A-→A, DX B+→A-. Overall B-→B+. Marked resolved items in Priority Fixes (Next.js 15.3.8, Chromatic, ESLint cache, app workflows, READMEs). Added new findings for Jest preset system, plan lifecycle, 23 workflows. |
| 2026-01-16 | Codex | Corrected README counts in summaries and recommendations. |

## Related Documents

- [Git Safety Guide](git-safety.md)
- [Security Audit 2026-01](security-audit-2026-01.md)
- [Coverage Configuration](coverage.md)
- [CI/CD Roadmap](ci-and-deploy-roadmap.md)
- [Contributing Guide](contributing.md)
