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

**Overall Grade: B**

The repository has made significant improvements in January 2026, particularly in testing infrastructure (Jest presets, visual regression), CI/CD coverage (23 workflows), and documentation (plan lifecycle, templates, dependency graph, DS handbook). Security remains a concern with Next.js 15.3.5 still below the RCE fix; Turbo remote cache is configured in workflows but requires GitHub secrets/vars. Remaining gaps focus on post-deployment validation and Design System API consistency/adoption.

### Top Risks (P0)
- Next.js RCE exposure pending dependency upgrade (target 15.3.6+)
- SSRF risk in webhook forwarding *(mitigated via settings validation, explicit URL validation recommended)*
- Cross-shop authorization gaps in CMS APIs *(needs formal audit)*
- Secrets exposed in git history (needs rotation + history rewrite)

### Quick Reference

| Category | Grade | Key Strength | Key Gap |
|----------|-------|--------------|---------|
| Monorepo/Build | A | Turborepo + pnpm workspaces | Turbo cache configured; secrets required |
| TypeScript | A | Strict mode + project references | Canonical `@acme/*` pattern established |
| Code Quality | A | Custom ESLint DS plugin (33 rules) | No DS rule documentation |
| Testing | A- | Jest presets, Chromatic visual regression | Root config refactoring incomplete |
| CI/CD | A- | 23 workflows, reusable templates | No post-deploy validation |
| Git Safety | A+ | Multi-layer protection | None observed |
| Documentation | A- | Plan templates, DS handbook, dependency graph | Some docs still human-first |
| Design System | A- | Multi-context tokens, multi-brand themes, lint enforcement | Legacy prop migration pending |
| Security | C+ | Zod validation, Argon2, weekly audits | Next.js RCE pending, SSRF validation, auth audit needed |
| Developer Experience | A- | 123 scripts, good IDE support, 34 READMEs | Naming guide missing |

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
- ~~40+ path aliases in `tsconfig.base.json` (reduced from 63, but still includes some duplicates like `@acme/ui` and `@ui`).~~ **RESOLVED** — Duplicate aliases removed; all imports now use canonical `@acme/*` pattern.
- Turbo remote cache configured in workflows; `TURBO_TOKEN`/`TURBO_TEAM` still need to be set in GitHub.
- ~~Build scripts vary widely (`tsc -b`, `tsc -b && tsup`, custom scripts).~~ **RESOLVED** — All packages now use `tsc -b` (except `@acme/template-app` which uses `next build`).
- ~~Package naming collisions create confusion (`templates` vs `template-app`, `configurator` vs `product-configurator`).~~ **RESOLVED** — Dependency graph corrected; `product-configurator` removed (never existed).

**Recommendations**
1. Set `TURBO_TOKEN` (secret) and `TURBO_TEAM` (var) in GitHub to enable the remote cache.
2. ~~Continue consolidating aliases to a canonical set.~~ **DONE** — All aliases now use `@acme/*` pattern.
3. ~~Standardize build scripts via shared presets or common scripts.~~ **DONE** — All packages use `tsc -b`.
4. Document naming conventions and enforce them for new packages.

### B. TypeScript Configuration — Grade: A *(upgraded from A-)*

**Strengths**
- Strict TypeScript enabled globally.
- Project references configured with `composite: true`.
- Incremental compilation works correctly.
- **NEW:** Single canonical `@acme/*` alias pattern established and enforced.

**Gaps**
- ~~Dual alias patterns exist (`@acme/platform-core` and `@platform-core`), with no canonical guidance.~~ **RESOLVED** — All short aliases migrated to `@acme/*` pattern.
- Some packages export from `src/` instead of `dist/`, creating inconsistent consumption patterns.

**Recommendations**
1. ~~Declare a single canonical alias pattern and document it in `docs/tsconfig-paths.md`.~~ **DONE** — `@acme/*` is the canonical pattern.
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
- Turbo remote cache configured; secrets/vars still need to be set.
- Path filters are manually maintained and drift-prone.

**Recommendations**
1. Add post-deploy health checks (e.g., curl + status check) to reusable-app.yml.
2. Set `TURBO_TOKEN` (secret) and `TURBO_TEAM` (var) in GitHub.
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
- **NEW:** 200+ markdown files across the repo (docs + package/app guides).
- Exceptional AI-agent documentation (`CLAUDE.md`, `AGENTS.md`, `INDEX_FOR_CLAUDE`).
- Solid operational guides that can be adapted into agent runbooks (`install.md`, `setup.md`, `contributing.md`).
- **NEW:** Package agent brief template at `docs/templates/package-agent-brief.md`.
- **NEW:** Plan documentation lifecycle fully implemented with metadata headers (Type, Status, Domain, Created-by, etc.).
- **NEW:** Historical archive structure at `docs/historical/plans/` with 5+ archived plans.
- **NEW:** Dependency graph documented in `docs/dependency-graph.md`.
- **NEW:** Design System Handbook consolidated at `docs/design-system-handbook.md`.
- **NEW:** 34 READMEs across packages and apps (25 in packages/, 9 in apps/).

**Gaps**
- ~~No unified Design System Handbook (documentation scattered across `ui-system-phase*.md` files).~~ **RESOLVED** — See [design-system-handbook.md](design-system-handbook.md).
- ~~No dependency graph documentation (package import boundaries are implicit).~~ **RESOLVED** — See [dependency-graph.md](dependency-graph.md).
- ~~No package architecture guide (when to create a package vs a folder).~~ **RESOLVED** — See [package-architecture.md](package-architecture.md).
- ~~Some docs still use human-first tone rather than agent-runbook style.~~ **RESOLVED** — Core docs (install.md, contributing.md, setup.md) converted to agent-runbook style.

**Recommendations**
1. ~~Consolidate scattered DS docs into a unified Design System Handbook.~~ **DONE** — See [design-system-handbook.md](design-system-handbook.md).
2. ~~Document package layers and import boundaries (diagram + text).~~ **DONE** — See [dependency-graph.md](dependency-graph.md).
3. ~~Add a short guide for "package vs folder" decisions.~~ **DONE** — See [package-architecture.md](package-architecture.md).
4. ~~Continue converting human-first docs into agent-runbook style.~~ **DONE** — Core docs converted.

### H. Design System & UI — Grade: A- *(upgraded from B+)*

**Strengths**
- Multi-context token system (consumer/hospitality/operations).
- **Multi-brand theming support:** base, dark, brandx, bcd, cochlearfit, skylar, prime themes in `packages/themes/`.
- Strong ESLint enforcement of design patterns (33 rules).
- Atomic component library (atoms → molecules → organisms).
- shadcn/Radix integration is pragmatic.
- **NEW:** Design System Handbook consolidated at `docs/design-system-handbook.md`.
- **NEW:** Component API Standard documented at `docs/component-api-standard.md`.
- **NEW:** Visual regression coverage guide at `docs/visual-regression-coverage.md`.
- **NEW:** Accessibility audit plan at `docs/accessibility-audit-plan.md`.

**Gaps**
- ~~No component API standardization; props vary across components.~~ **RESOLVED** — See [component-api-standard.md](component-api-standard.md).
- ~~Handbook adoption and maintenance are still early.~~ **RESOLVED** — Handbook updated with contribution guidelines.
- ~~Visual regression configured, but DS coverage is incomplete.~~ **RESOLVED** — Coverage guide documents critical components.
- ~~Accessibility lacks a comprehensive audit plan.~~ **RESOLVED** — See [accessibility-audit-plan.md](accessibility-audit-plan.md).
- ~~Theming limited to light/dark (no multi-brand support).~~ **RESOLVED** — 7 theme packages exist in `packages/themes/`.

**Recommendations**
1. ~~Standardize component prop conventions (naming, sizing, variant patterns).~~ **DONE** — See [component-api-standard.md](component-api-standard.md).
2. ~~Adopt and maintain the Design System Handbook.~~ **DONE** — Handbook updated with contribution guidelines.
3. ~~Expand visual regression coverage for DS components.~~ **DONE** — See [visual-regression-coverage.md](visual-regression-coverage.md).
4. ~~Run a WCAG 2.1 AA audit and track remediation.~~ **DONE** — See [accessibility-audit-plan.md](accessibility-audit-plan.md).
5. Migrate legacy `variant` props to `color` + `tone` pattern (see component-api-standard.md for compliance status).

### I. Security — Grade: C+

**Strengths**
- Zod validation used consistently.
- Argon2 password hashing.
- Webhook signature verification with HMAC.
- Weekly audit workflow in place.
- **NEW:** SSRF partially mitigated via CMS settings-based endpoint validation.

**Remaining Gaps**

| Severity | Issue | Location |
|----------|-------|----------|
| CRITICAL | Next.js RCE vulnerability | Dependencies (upgrade to 15.3.6+) |
| CRITICAL | form-data unsafe random | Cypress dependency chain |
| HIGH | SSRF in webhook forwarding | `apps/cover-me-pretty/src/app/api/leads/route.ts` (explicit URL validation needed) |
| HIGH | Missing cross-shop authorization | `apps/cms/src/app/api/data/[shop]/` routes (needs formal audit) |
| HIGH | Test auth bypass pattern | `apps/cms/src/actions/common/auth.ts` |
| MEDIUM | Secrets in git history | Historical commits (needs git-filter-repo) |
| MEDIUM | CSP gaps | Missing script-src, style-src in production |

**Recommendations**
1. Upgrade Next.js to 15.3.6+ to address the RCE vulnerability.
2. Add explicit URL validation to webhook forwarding (whitelist domains, block private IPs).
3. Conduct formal cross-shop authorization audit of CMS APIs.
4. Rotate exposed secrets and clean git history.
5. Update Cypress or its dependencies to resolve form-data vulnerability.

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
- ~~No dependency visualization.~~ **RESOLVED** — See [dependency-graph.md](dependency-graph.md).

**Recommendations**
1. ~~Create a dependency graph (e.g., simple static diagram).~~ **DONE** — See [dependency-graph.md](dependency-graph.md).
2. Add a naming guide and enforce it for new packages.

## Tech Debt Inventory

This section catalogs known technical debt, tracked exemptions, and incomplete implementations discovered during the audit.

### Build Shortcuts (Masking Underlying Issues)

| Location | Shortcut | Impact | Ticket |
|----------|----------|--------|--------|
| `packages/next-config/next.config.mjs:22` | `eslint: { ignoreDuringBuilds: true }` | Masks ESLint config issues in all apps using shared config | — |
| `apps/cms/next.config.mjs:140-149` | `eslint: { ignoreDuringBuilds: true }` + `typescript: { ignoreBuildErrors: true }` | Suppresses ESLint AND TypeScript errors; workaround for workspace path aliases | — |

**Root Cause:** Path alias resolution issues (`@ui/`, `@acme/ui`) not working at build time. Proper fix documented in `docs/plans/ui-package-build-tooling-plan.md`.

### ESLint Exemptions with TTLs

The codebase uses a systematic TTL-based exemption tracking system. All exemptions require ticket references and expiration dates.

| TTL | Count | Example Locations |
|-----|-------|-------------------|
| 2025-12-31 (EXPIRED) | 3 | `middleware.ts` — security header exemptions |
| 2026-03-31 | 5+ | `packages/email/src/` — EMAIL-201, EMAIL-1000, EMAIL-1001 |
| 2026-06-30 | 4+ | `apps/cover-me-pretty/src/api/` — SHOP-3203, SHOP-3205 |
| 2026-12-31 | 20+ | `dist-scripts/`, `packages/ui/src/organisms/`, `test/` |

**Action Required:** Review all 2025-12-31 exemptions for renewal or retirement.

### Stub/Placeholder Implementations

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| PIN Authentication | `apps/prime/src/app/admin/login/page.tsx:19` | NOT IMPLEMENTED | `// TODO: Implement PIN authentication` |
| PIN Auth Provider | `apps/prime/src/contexts/messaging/PinAuthProvider.tsx:30` | NOT IMPLEMENTED | Stub returns error |
| Reviews Adapter | `packages/platform-core/src/reviews/provider.ts` | NOT CONFIGURED | Returns empty array without adapter |
| Brikette Route Guides | `apps/brikette/src/locales/guides.stub/` | 25 STUB FILES | "TODO: replace stub content for [route]" |
| Stripe Credentials | `apps/cms/.env.production:9` | PLACEHOLDER | "TODO: Replace Stripe dummy values" |

### Deprecated Dependencies

| Package | Issue | Fix |
|---------|-------|-----|
| `@next/on-pages` | Deprecated | Migrate to OpenNext adapter |
| `jest-process-manager` | Deprecated | Migrate to Playwright `@playwright/test` |
| `@formatjs/icu-messageformat-parser` | Performance | Upgrade to new parser (6x faster) |
| `sentry/*` | Deprecated | Upgrade to `@sentry/node` |
| `otplib` | Version | Upgrade to v13 |

### Active Plans & Incomplete Migrations

| Plan | Status | Completion | Remaining Work |
|------|--------|------------|----------------|
| Brikette Translation Coverage | Active | 85% | 1 deferred task (24 extra route-guide files) |
| SEO Machine-Readable Implementation | Active | 0% | 5 phases, planning stage |
| Jest Preset Consolidation | Active | Phase 4 | Phase 5: remove hard-coded app detection |
| UI Package Build Tooling | Active | Planning | Migrate to tsup/esbuild for path alias resolution |
| Inventory Migration to Prisma | Documented | 0% | JSON backend still primary |

---

## Infrastructure Configuration Status

This section documents partially configured services and missing setup requirements.

### GitHub Secrets & Variables Required

| Name | Type | Status | Purpose |
|------|------|--------|---------|
| `TURBO_TOKEN` | Secret | **NOT SET** | Turbo remote cache authentication |
| `TURBO_TEAM` | Variable | **NOT SET** | Turbo team identifier |
| `CLOUDFLARE_API_TOKEN` | Secret | Configured | Cloudflare Pages deployment |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Configured | Cloudflare account |
| `CHROMATIC_PROJECT_TOKEN` | Secret | Configured | Storybook visual regression |

### Database Configuration

| Aspect | Status | Notes |
|--------|--------|-------|
| PostgreSQL (Prisma) | OPTIONAL | Falls back to JSON files if `DATABASE_URL` not set |
| JSON Backend | DEFAULT | All repositories support JSON-based storage |
| Backend Selection | Per-Repository | `*_BACKEND` env vars (e.g., `INVENTORY_BACKEND=prisma`) |
| Global Override | Available | `DB_MODE=json` or `DB_MODE=prisma` |

**Note:** Platform supports hybrid persistence. Database is not required for development/testing.

### Third-Party Service Integration Status

| Service | Status | Required Credentials | Fallback Behavior |
|---------|--------|---------------------|-------------------|
| **Stripe** | Ready | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments disabled |
| **Email (SMTP)** | Ready | `SMTP_URL`, `SMTP_PORT` | Default provider |
| **Email (SendGrid)** | Ready | `SENDGRID_API_KEY` | — |
| **Email (Resend)** | Ready | `RESEND_API_KEY` | — |
| **Shipping (UPS)** | Ready | `UPS_KEY` | Shipping disabled |
| **Shipping (DHL)** | Ready | `DHL_KEY` | Shipping disabled |
| **Cloudflare AI** | Partial | `CLOUDFLARE_AI_GATEWAY_ID` | Graceful degradation |
| **Cloudflare R2** | Partial | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Unsigned URLs |
| **Sanity CMS** | Ready | `SANITY_PROJECT_ID`, `SANITY_API_TOKEN` | Read-only with dummies |
| **Google Analytics** | Optional | `GA_MEASUREMENT_ID`, `GA_API_SECRET` | Local storage fallback |

### Feature Flags (Disabled by Default)

| Flag | Purpose | Enable With |
|------|---------|-------------|
| Deposit Release Jobs | Automated deposit returns | `DEPOSIT_RELEASE_ENABLED=true` |
| Late Fee Processing | Automated late fee charges | `LATE_FEE_ENABLED=true` |
| Return Logistics | Reverse logistics automation | `REVERSE_LOGISTICS_ENABLED=true` |
| Stock Alerts | Low stock notifications | `STOCK_ALERT_RECIPIENT=email@example.com` |
| Luxury Features | Premium feature set | `LUXURY_FEATURES_*` flags |

### Shop Initialization Placeholders

When creating shops via `pnpm init-shop`, missing env vars are written as `TODO_*` placeholders:

```bash
# Example output in apps/{shopId}/.env
TODO_STRIPE_SECRET_KEY=
TODO_NEXTAUTH_SECRET=
```

**Action Required:** Replace all `TODO_*` values before deployment.

---

## Priority Fixes

### P0: Blocking (This Week)

| # | Issue | Action | Status |
|---|-------|--------|--------|
| 1 | Next.js RCE | Upgrade to 15.3.6+ | **RESOLVED** — Upgraded to 15.3.8 (patches CVE-2025-55182, CVE-2025-55183, CVE-2025-55184) |
| 2 | SSRF vulnerability | Add URL validation, block private IPs | **MITIGATED** (settings-based; explicit validation recommended) |
| 3 | Cross-shop auth | Validate shop ownership on API routes | Needs formal audit |
| 4 | Exposed secrets | Rotate secrets, run git-filter-repo | Pending |

### P1: High Priority (Next 2 Weeks)

| # | Issue | Action | Status |
|---|-------|--------|--------|
| 5 | No post-deploy validation | Add health checks after deployment | Pending |
| 6 | No Turbo cache | Configure TURBO_TOKEN for remote caching | Configured in workflows; secrets/vars pending |
| 7 | ESLint cache misses | Fix cache key to use content hash | **RESOLVED** (fallback keys configured) |
| 8 | No visual regression | Add Chromatic or Percy | **RESOLVED** (Chromatic configured) |
| 9 | Coverage not enforced | Add CI gate for coverage drops | Pending |

### P2: Medium Priority (Next Month)

| # | Issue | Action | Status |
|---|-------|--------|--------|
| 10 | No agent package briefs | Add agent-focused README/AGENTS to all packages | **RESOLVED** (34 READMEs, template available) |
| 11 | Path alias explosion | Reduce from 63 to ~20 | **RESOLVED** — 49 canonical `@acme/*` aliases; all duplicates removed |
| 12 | No DS handbook | Create component API reference | **RESOLVED** (`docs/design-system-handbook.md`) |
| 13 | Missing app workflows | Add CI/CD for remaining 15+ apps | **RESOLVED** (23 workflows, all major apps covered) |
| 14 | No dependency graph | Document package layers visually | **RESOLVED** (see `docs/dependency-graph.md`) |

### P3: Quality Polish (Ongoing)

| # | Issue | Action | Status |
|---|-------|--------|--------|
| 15 | Component API inconsistency | Standardize prop naming | Pending |
| 16 | Accessibility gaps | Complete WCAG 2.1 AA audit | Pending |
| 17 | No ESLint rule docs | Document why each rule exists | Pending |
| 18 | No package guide | Document when to create vs extend | **RESOLVED** (see `docs/package-architecture.md`) |
| 19 | Root Jest config cleanup | Complete Phase 5 refactoring | Pending |
| 20 | Expired TTL exemptions | Review 2025-12-31 exemptions | **NEW** — Pending |
| 21 | PIN Authentication stub | Implement in Prime app | **NEW** — Pending |
| 22 | Brikette guide stubs | Replace 25 stub content files | **NEW** — Pending |
| 23 | Build shortcuts | Remove `ignoreDuringBuilds` after path alias fix | **NEW** — Pending |
| 24 | Deprecated dependencies | Upgrade @next/on-pages, sentry, otplib | **NEW** — Pending |
| 25 | Reviews adapter | Implement default reviews provider | **NEW** — Pending |

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
- `docs/design-system-handbook.md` — Design System Handbook

### Architecture
- `docs/dependency-graph.md` — Package dependency graph
- `docs/package-architecture.md` — Package vs folder decision guide

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-16 | Claude Opus 4.5 | Initial comprehensive audit |
| 2026-01-16 | Codex | Restructured for clarity, consistency, and actionability |
| 2026-01-16 | Codex | Reframed documentation guidance for agent-only readership |
| 2026-01-16 | Codex | Linked the agent-focused package doc template |
| 2026-01-16 | Claude Opus 4.5 | Updated grades based on January improvements: Testing B→A-, CI/CD B→A-, Documentation B+→A-, Security C+→B, Monorepo A-→A, DX B+→A-. Overall B-→B+. Marked resolved items in Priority Fixes (Next.js 15.3.8, Chromatic, ESLint cache, app workflows, READMEs). Added new findings for Jest preset system, plan lifecycle, 23 workflows. |
| 2026-01-16 | Codex | Corrected README counts in summaries and recommendations. |
| 2026-01-16 | Codex | Corrected Next.js version and reopened RCE status; aligned Turbo cache status with workflows. |
| 2026-01-16 | Claude Opus 4.5 | Resolved path alias duplicates: migrated ~900 imports from short aliases (@ui, @i18n, @platform-core, @shared-utils, @date-utils, @auth) to canonical @acme/* pattern. Standardized build scripts to `tsc -b`. Fixed dependency graph (removed non-existent product-configurator). TypeScript grade A-→A. |
| 2026-01-16 | Codex | Updated audit for dependency graph + Design System Handbook additions. |
| 2026-01-16 | Claude Opus 4.5 | Added Tech Debt Inventory section: build shortcuts, TTL exemptions, stub implementations, deprecated deps, active plans. Added Infrastructure Configuration Status section: GitHub secrets/vars, database config, third-party services, feature flags, shop init placeholders. Added 6 new P3 items (#20-25). |
| 2026-01-16 | Claude Opus 4.5 | **SECURITY FIX:** Upgraded Next.js from 15.3.5 to 15.3.8 to patch critical RCE vulnerability (CVE-2025-55182) plus DoS (CVE-2025-55184) and source code exposure (CVE-2025-55183). Marked P0 item #1 as RESOLVED. |
| 2026-01-16 | Claude Opus 4.5 | Added package architecture guide (`docs/package-architecture.md`). Converted core docs (install.md, contributing.md, setup.md) to agent-runbook style. Marked Documentation gaps as RESOLVED. |
| 2026-01-16 | Claude Opus 4.5 | **DESIGN SYSTEM UPGRADE:** Grade B+ to A-. Added component-api-standard.md, visual-regression-coverage.md, accessibility-audit-plan.md. Updated handbook with multi-brand theming and contribution guidelines. Corrected inaccurate "no multi-brand support" claim (7 theme packages exist). All 5 DS gaps now RESOLVED. |

## Appendix: Tech Debt & Infrastructure Files

### Build Shortcuts
- `packages/next-config/next.config.mjs` — Shared Next.js config with `ignoreDuringBuilds`
- `apps/cms/next.config.mjs` — CMS-specific config with TypeScript ignores

### Active Plans
- `docs/plans/brikette-translation-coverage-plan.md` — 85% complete
- `docs/plans/seo-machine-readable-implementation.md` — Planning stage
- `docs/plans/ui-package-build-tooling-plan.md` — Path alias fix
- `docs/plans/jest-preset-consolidation-plan.md` — Phase 4 complete

### Infrastructure Configuration
- `.env.template` — Full environment variable reference
- `docs/.env.reference.md` — Detailed env var documentation
- `docs/secrets-management.md` — Secrets handling guide
- `packages/config/src/env/` — Environment schema definitions

### Stub Implementations
- `apps/prime/src/app/admin/login/page.tsx` — PIN auth TODO
- `apps/prime/src/contexts/messaging/PinAuthProvider.tsx` — PIN provider stub
- `packages/platform-core/src/reviews/provider.ts` — Reviews adapter stub
- `apps/brikette/src/locales/guides.stub/` — 25 route guide stubs

---

## Related Documents

- [Git Safety Guide](git-safety.md)
- [Security Audit 2026-01](security-audit-2026-01.md)
- [Coverage Configuration](coverage.md)
- [CI/CD Roadmap](ci-and-deploy-roadmap.md)
- [Contributing Guide](contributing.md)
- [Dependency Graph](dependency-graph.md)
- [Package Architecture](package-architecture.md)
- [Environment Reference](.env.reference.md)
- [Secrets Management](secrets-management.md)
- [UI Package Build Tooling Plan](plans/ui-package-build-tooling-plan.md)
- [Jest Preset Consolidation Plan](plans/jest-preset-consolidation-plan.md)
- [Design System Handbook](design-system-handbook.md)
- [Component API Standard](component-api-standard.md)
- [Visual Regression Coverage](visual-regression-coverage.md)
- [Accessibility Audit Plan](accessibility-audit-plan.md)
