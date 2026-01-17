---
Type: Plan
Status: Active
Domain: Base-Shop
Last-reviewed: 2026-01-17
Relates-to charter: none
Last-updated: 2026-01-17
Last-updated-by: Codex
---

# Implementation Plan Index (Prioritized)

> **Note:** This file is a prioritized index to active plans, not a detailed plan.
> For task lists and acceptance criteria, see individual plans in `docs/plans/`.

## Now (P0 - Launch readiness + security)

| Plan | Status | Notes |
|------|--------|-------|
| [Next.js 15.3.6 Upgrade](docs/plans/nextjs-15-3-6-upgrade-plan.md) | Active | Security patch; lockfile update still pending |
| [Launch Shop Pipeline](docs/plans/launch-shop-pipeline-plan.md) | Active | Repo audit P0.1 |
| [Integrated Secrets Workflow](docs/plans/integrated-secrets-workflow-plan.md) | Active | Repo audit P0.2 |
| [Post-Deploy Health Checks Mandatory](docs/plans/post-deploy-health-checks-mandatory-plan.md) | Active | Repo audit P0.3 |

## Next (P1 - Platform quality + CI)

| Plan | Status | Notes |
|------|--------|-------|
| [E2E Ownership Consolidation](docs/plans/e2e-ownership-consolidation-plan.md) | Active | Finalize ownership and workflow boundaries |
| [CI & Deploy Roadmap](docs/plans/ci-deploy/ci-and-deploy-roadmap.md) | Active | CMS deploy + CI path filters |
| [Ralph Methodology Adoption](docs/plans/ralph-methodology-adoption-plan.md) | Active | Close out doc/workflow consolidation |
| [Agent Git Instruction Updates](docs/plans/agent-git-instructions-update-plan.md) | Active | PR + CI + staging expectations |
| [UI Lint Remediation](docs/plans/ui-lint-remediation-plan.md) | Active | @acme/ui lint cleanup |
| [No-Hardcoded-Copy Exemptions](docs/plans/no-hardcoded-copy-non-ui-exemptions-plan.md) | Active | Reduce lint noise in non-UI paths |
| [Lint Warnings: Mission Control + Brikette Scripts](docs/plans/lint-warnings-mission-control-brikette-scripts-plan.md) | Active | Fix restored lint blockers |

## Product Tracks (Active / Parallel)

| Track | Plans | Notes |
|-------|-------|-------|
| Prime | [Prime Next.js Port](docs/plans/prime-nextjs-port-plan.md), [Prime Optimization](docs/plans/prime-optimization-plan.md), [Prime Improvement](docs/plans/prime-improvement-plan.md), [Prime Pre-Arrival](docs/plans/prime-pre-arrival-plan.md) | Improvement and pre-arrival depend on the port stability |
| Reception | [Reception Next.js Migration](docs/plans/reception-nextjs-migration-plan.md), [Functionality Improvements](docs/plans/reception-functionality-improvements-plan.md), [Login UI Improvement](docs/plans/reception-login-ui-improvement-plan.md), [Stock + Cash Control](docs/plans/reception-stock-cash-control-plan.md) | Auth/roles flow is a prerequisite for most work |
| Brikette | [Translation Coverage Fix](docs/plans/brikette-translation-coverage-plan.md), [Lint Warnings](docs/plans/lint-warnings-mission-control-brikette-scripts-plan.md), [Brikette Improvement Plan](docs/plans/brikette-improvement-plan.md) | Improvement plan needs Plan-format metadata |
| Commerce | [Handbag Configurator](docs/plans/handbag-configurator-implementation-plan.md) | Scoped to current monorepo scaffolds |
| QA | [XA 80% Coverage](docs/plans/xa-coverage-80-plan.md) | Enforce coverage thresholds for apps/xa |

## Later / Draft (P2+)

| Plan | Status | Notes |
|------|--------|-------|
| [Edge Commerce Standardization](docs/plans/edge-commerce-standardization-implementation-plan.md) | Draft | Long-horizon, high-scope |
| [SEO + Machine-Readable Infrastructure](docs/plans/seo-machine-readable-implementation.md) | Draft | Missing Plan metadata |
| [Dashboard Upgrade Aggregator](docs/plans/dashboard-upgrade-aggregator-plan.md) | Draft | Moved into docs/plans |

## Recently Completed

| Plan | Completed | Notes |
|------|-----------|-------|
| [Lint-Staged Autostash Avoidance](docs/historical/plans/lint-staged-autostash-avoidance-plan.md) | 2026-01-17 | Archived plan |
| [Jest Preset Consolidation](docs/plans/jest-preset-consolidation-plan.md) | 2026-01-16 | Completed |
| [Monorepo ESLint Standardization](docs/plans/monorepo-eslint-standardization-plan.md) | 2026-01-15 | Completed |
| [UI Package Build Tooling](docs/plans/ui-package-build-tooling-plan.md) | 2026-01-15 | Completed |
| [Structured ToC Block Refactor](docs/plans/structured-toc-block-plan.md) | 2026-01-15 | Completed |

---

## Sprint Status (Legacy)

For historical context, the original sprint tracking content is preserved below.

<details>
<summary>Sprint 0-8 Status (from original IMPLEMENTATION_PLAN.md)</summary>

**"Base-Shop" — Implementation Plan**
rev 2025-06-21 · Sprint 5 status update

| Layer | Tech & notes |
|-------|--------------|
| Framework | Next.js 15 (App Router, React 19) |
| Styling | Tailwind CSS 4.1 |
| i18n | JSON bundles (en, de, it) via Context |
| State | React hooks · CartContext → localStorage |
| Payments | Stripe Elements v2025-05-28 – edge-ready client |
| API | Edge Routes: /api/cart · /api/checkout-session |
| Tooling | TS 5.8 · ESLint/Prettier · Jest/RTL · Playwright 1.53 · Wrangler |

### Sprint Tracker

| Sprint | Key outputs | Status |
|--------|-------------|--------|
| S-0 | Bootstrap Scaffold, CI, configs | ✅ |
| S-1 | Layout + i18n LocaleLayout · nav | ✅ |
| S-2 | Home MVP Hero & core content | ✅ |
| S-3 | Shop catalogue Product grid · cart | ✅ |
| S-4 | PDP + Cart API | ✅ |
| S-5 | Checkout flow Stripe Elements | ✅ 100% |
| S-6 | Blog pipeline MDX loader · ISR 1h | ⏳ |
| S-7 | SEO & a11y JSON-LD · alt audit | ⏳ |
| S-8 | Launch-hardening E2E · error pages | ⏳ |

### Sprint 5 Completion Notes

- /api/checkout-session creates PaymentIntent with subtotal, deposit, sizes, tax metadata
- Success/cancel routes implemented; confirmPayment redirect flow verified
- UI test asserts Elements/PaymentElement renders once clientSecret is available
- Lighthouse guidance captured in docs/lighthouse.md

### QA Coverage Addendum

- Added RTL + jest-axe suites for all service editors under `apps/cms/src/app/cms/shop/[shop]/settings/**/__tests__`
- Exercised new SEO quick actions (AI catalog + audit panels) with toast announcements
- All audited UIs passed axe checks

</details>
