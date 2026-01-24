---
Type: Plan
Status: Active
Domain: Base-Shop
Last-reviewed: 2026-01-17
Relates-to charter: none
Last-updated: 2026-01-20
Last-updated-by: Claude
---

# Implementation Plan Index (Prioritized)

> **Note:** This file is a prioritized index to active plans, not a detailed plan.
> For task lists and acceptance criteria, see individual plans in `docs/plans/`.

## Now (P0 - Launch readiness + security)

| Plan | Status | Notes |
|------|--------|-------|
| [Next.js 15.3.6 Upgrade](docs/plans/archive/nextjs-15-3-6-upgrade-plan.md) | Complete | Superseded - upgraded to 15.3.8 ✅ |
| [Launch Readiness Hardening (M0–M2)](docs/plans/archive/launch-readiness-hardening-plan.md) | Complete | All M0-M2 PRs merged ✅ |
| [Launch Shop Pipeline](docs/plans/archive/launch-shop-pipeline-plan.md) | Complete | Repo audit P0.1 ✅ |
| [Integrated Secrets Workflow](docs/plans/archive/integrated-secrets-workflow-plan.md) | Complete | Repo audit P0.2 ✅ |
| [Post-Deploy Health Checks Mandatory](docs/plans/archive/post-deploy-health-checks-mandatory-plan.md) | Complete | Repo audit P0.3 ✅ |

## Next (P1 - Platform quality + CI)

| Plan | Status | Notes |
|------|--------|-------|
| [CI & Deploy Roadmap](docs/plans/ci-deploy/ci-and-deploy-roadmap.md) | Active | CMS deploy + CI path filters |
| [Ralph Methodology Adoption](docs/historical/plans/ralph-methodology-adoption-plan.md) | Active | Close out doc/workflow consolidation |
| [Agent Git Instruction Updates](docs/plans/agent-git-instructions-update-plan.md) | Active | PR + CI + staging expectations |
| [Agent Language Intelligence (TypeScript in VS Code)](docs/plans/agent-language-intelligence-plan.md) | Draft | Shared TS diagnostics/types for Claude + Codex |
| [UI Lint Remediation](docs/plans/ui-lint-remediation-plan.md) | Complete | @acme/ui 0 warnings (100% reduction from 1477) |
| [No-Hardcoded-Copy Exemptions](docs/plans/no-hardcoded-copy-non-ui-exemptions-plan.md) | Complete | All path exemptions implemented |

## Product Tracks (Active / Parallel)

| Track | Plans | Notes |
|-------|-------|-------|
| Prime | [Prime Next.js Port](docs/historical/plans/prime-nextjs-port-plan.md), [Prime Optimization](docs/historical/plans/prime-optimization-plan.md), [Prime Improvement](docs/historical/plans/prime-improvement-plan.md), [Prime Pre-Arrival](docs/historical/plans/prime-pre-arrival-plan.md) | Improvement and pre-arrival depend on the port stability |
| Reception | [Reception Next.js Migration](docs/plans/archive/reception-nextjs-migration-plan.md), [Functionality Improvements](docs/plans/archive/reception-functionality-improvements-plan.md), [Stock + Cash Control](docs/plans/reception-stock-cash-control-plan-v2.md) | Auth/roles flow is a prerequisite for most work. Login UI plan completed (archived). |
| Brikette | [Translation Coverage Fix](docs/plans/brikette-translation-coverage-plan.md), [Brikette Improvement Plan](docs/plans/archive/brikette-improvement-plan.md) | Improvement plan needs Plan-format metadata |
| Commerce | [Handbag Configurator](docs/plans/handbag-configurator-implementation-plan.md) | Scoped to current monorepo scaffolds |
| XA | [XA Client Readiness](docs/plans/xa-client-readiness-plan.md), [XA 80% Coverage](docs/plans/xa-coverage-80-plan.md) | Member rewards storefront - preparing for client review |

## Later / Draft (P2+)

| Plan | Status | Notes |
|------|--------|-------|
| [Edge Commerce Standardization](docs/plans/edge-commerce-standardization-implementation-plan.md) | Draft | Long-horizon, high-scope |
| [SEO + Machine-Readable Infrastructure](docs/plans/seo-machine-readable-implementation.md) | Draft | Missing Plan metadata |
| [Dashboard Upgrade Aggregator](docs/plans/dashboard-upgrade-aggregator-plan.md) | Draft | Moved into docs/plans |

## Recently Completed

| Plan | Completed | Notes |
|------|-----------|-------|
| [Lint Warnings: MC + Brikette Scripts](docs/plans/archive/lint-warnings-mission-control-brikette-scripts-plan.md) | 2026-01-20 | All tasks verified complete |
| [E2E Ownership Consolidation](docs/historical/plans/e2e-ownership-consolidation-plan.md) | 2026-01-17 | One suite, one owner, one workflow |
| [Lint-Staged Autostash Avoidance](docs/historical/plans/lint-staged-autostash-avoidance-plan.md) | 2026-01-17 | Archived plan |
| [Jest Preset Consolidation](docs/historical/plans/jest-preset-consolidation-plan.md) | 2026-01-16 | Completed |
| [Monorepo ESLint Standardization](docs/historical/plans/monorepo-eslint-standardization-plan.md) | 2026-01-15 | Completed |
| [UI Package Build Tooling](docs/historical/plans/ui-package-build-tooling-plan.md) | 2026-01-15 | Completed |
| [Structured ToC Block Refactor](docs/historical/plans/structured-toc-block-plan.md) | 2026-01-15 | Completed |

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
