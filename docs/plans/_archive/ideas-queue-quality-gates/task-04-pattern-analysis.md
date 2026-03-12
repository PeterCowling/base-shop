# Ideas Queue — Operator Idea Pattern Analysis (Clean Data)

**Date:** 2026-03-12
**Source:** `docs/business-os/startup-loop/ideas/trial/queue-state.json` (post-cleanup)

## Data Quality Summary

| Metric | Value |
|---|---|
| Total dispatches | 554 |
| Clean dispatches | 373 |
| Noise-flagged | 181 (33%) |
| Missing domain | 0 (was 291 pre-cleanup) |
| Clean operator_idea | 358 (96% of clean) |
| Clean artifact_delta | 15 (4% of clean) |
| Enqueued (actionable backlog) | 61 |
| Completed/processed | 312 |

**Noise rate post-cleanup: 0%** — all remaining dispatches pass content guards.

## Trigger Source Imbalance

The queue is almost entirely manual operator submissions (96%). Only BOS has any artifact_delta auto-detection (21% of BOS dispatches). Every other business is at 0% auto-detection.

| Business | operator_idea | artifact_delta | Auto-detect % |
|---|---|---|---|
| BRIK | 175 | 0 | 0% |
| XA | 57 | 0 | 0% |
| HBAG | 37 | 0 | 0% |
| BOS | 56 | 15 | 21% |
| PLAT | 26 | 0 | 0% |
| PWRB | 5 | 0 | 0% |

**Key insight:** The loop currently relies on the operator manually noticing and reporting problems. Standing artifacts would let the loop auto-detect problems from document changes, shifting from reactive to proactive.

## Domain Distribution (Clean Data)

| Domain | Count | % | Enqueued |
|---|---|---|---|
| BOS | 135 | 36.9% | 15 |
| PRODUCTS | 105 | 28.7% | 21 |
| SELL | 76 | 20.8% | 21 |
| STRATEGY | 41 | 11.2% | 2 |
| LOGISTICS | 6 | 1.6% | 1 |
| MARKET | 3 | 0.8% | 1 |

## Business Concentration (Clean operator_ideas)

| Business | Count | % | Enqueued |
|---|---|---|---|
| BRIK | 175 | 49.9% | 33 |
| XA | 57 | 16.2% | 14 |
| BOS | 56 | 16.0% | 6 |
| HBAG | 30 | 8.5% | 6 |
| PLAT | 26 | 7.4% | 2 |
| PWRB | 5 | 1.4% | 3 |

BRIK dominates the queue at 50% — expected as the most active business.

## Top Pattern Clusters (Business x Domain)

| Business x Domain | Total | Enqueued | Theme |
|---|---|---|---|
| BRIK x PRODUCTS | 53 | 9 | Reception UI theming, component quality, email desk |
| BRIK x BOS | 53 | 8 | CI/deploy, email pipeline infra, recovery |
| BOS x BOS | 50 | 6 | Loop tooling, skill efficiency, self-evolving |
| BRIK x SELL | 48 | 12 | Booking/payment, SEO, email reply quality, funnel |
| XA x PRODUCTS | 34 | 9 | Product upload, catalog management, publish safety |
| HBAG x SELL | 23 | 10 | Caryina storefront, pricing, i18n, SEO |
| BRIK x STRATEGY | 18 | 0 | RBAC, measurement, dead code (all completed) |
| HBAG x PRODUCTS | 14 | 3 | Caryina product data, error pages, email security |
| PLAT x BOS | 14 | 1 | Ideas queue, results-review, pattern-reflection |
| PLAT x STRATEGY | 11 | 2 | Agent permissions, tool selection, failure contract |

## Thematic Patterns

### 1. Product Upload & Catalog (50 dispatches, 12 enqueued)
Dominated by XA (34) and HBAG (8). Problems: missing product images, no offline testing, unfiltered product lists, publish safety, sync failures.

**Standing artifact opportunity:** XA and HBAG have no PRODUCTS-domain standing artifacts tracking catalog completeness or upload quality. When product data degrades, nobody notices until a customer complains.

### 2. Email Pipeline & Recovery (45 dispatches combined, 8 enqueued)
Exclusively BRIK. Two sub-themes: (a) email processing infrastructure (labels, audit log, lock-released entries) and (b) guest-facing reply quality (two replies, stuck emails, recovery).

**Standing artifact opportunity:** BRIK has no standing artifact tracking email pipeline health — recovery rates, draft quality metrics, or processing error rates. These are all detectable from existing data.

### 3. Loop Tooling & Self-Evolving (28 dispatches, 2 enqueued)
BOS and PLAT. Problems: backbone queue closure, evidence admission, event ledger gaps, results-review and pattern-reflection prefill issues.

**Standing artifact opportunity:** Already partially covered by existing BOS standing artifacts (AGENT_SESSION_FINDINGS, REPO_MATURITY_SIGNALS). The gap is self-evolving effectiveness tracking — no artifact captures whether prescriptions are working.

### 4. Booking, Payment & Pricing (24 dispatches, 3 enqueued)
BRIK and HBAG. Problems: wrong prices, checkout failures, cart disabled, payment holds.

**Standing artifact opportunity:** BRIK has SELL-FUNNEL-BRIEF and SELL-OCTORATE-BASELINE but no price-accuracy or checkout-success tracking. HBAG/Caryina has no SELL-domain standing artifacts at all.

### 5. CI/Deploy/Staging (21 dispatches, 4 enqueued)
Cross-business. Problems: slow staging deploys, missing health checks, no post-deployment verification, no CI for XA apps.

**Standing artifact opportunity:** No standing artifact tracks deployment health or CI coverage across apps. When a deploy breaks something, discovery is manual.

### 6. Reception UI Theming (18 dispatches, 11 enqueued)
Mostly BRIK. Problems: broken colours, hardcoded values, dark mode issues, design token violations, PIN screen inconsistencies.

**Standing artifact opportunity:** No standing artifact tracks design-system compliance. These are detectable by automated contrast sweeps, but the results aren't persisted as standing data.

### 7. SEO & Internationalisation (12 dispatches, 3 enqueued)
BRIK, XA, HBAG. Problems: missing canonicals, (en) in page titles, untranslated strings, raw i18n keys.

**Standing artifact opportunity:** BRIK has a funnel brief but no SEO health artifact. HBAG has no SEO tracking. These are all detectable from existing SEO audit tools.

## Standing Artifact Recommendations

Priority ranking based on: (1) number of dispatches the artifact would auto-detect, (2) number of businesses affected, (3) whether the data source already exists.

### Priority 1: High impact, data sources exist

| Proposed Artifact ID | Business | Domain | Dispatches covered | Data source |
|---|---|---|---|---|
| `BRIK-BOS-EMAIL-PIPELINE-HEALTH` | BRIK | BOS | ~34 email pipeline + recovery | Gmail API telemetry, audit log, recovery events |
| `HBAG-SELL-STOREFRONT-HEALTH` | HBAG | SELL | ~23 Caryina issues | SEO audit output, i18n parity checks, price validation |
| `XA-PRODUCTS-CATALOG-QUALITY` | XA | PRODUCTS | ~34 upload/catalog issues | Catalog sync API, product completeness checks |
| `BRIK-SELL-BOOKING-FUNNEL-HEALTH` | BRIK | SELL | ~24 booking/payment | GA4 funnel data, Octorate calendar, checkout success |

### Priority 2: Moderate impact, cross-business

| Proposed Artifact ID | Business | Domain | Dispatches covered | Data source |
|---|---|---|---|---|
| `BOS-BOS-DEPLOY-HEALTH` | BOS | BOS | ~21 CI/deploy | GitHub Actions status, Cloudflare deployment logs |
| `BOS-BOS-DESIGN-TOKEN-COMPLIANCE` | BOS | BOS | ~18 theming issues | Contrast sweep output, design token audit |
| `BOS-BOS-SELF-EVOLVING-EFFECTIVENESS` | BOS | BOS | ~28 loop tooling | Backbone queue state, prescription outcome tracking |

### Priority 3: Business-specific gaps

| Proposed Artifact ID | Business | Domain | Dispatches covered | Data source |
|---|---|---|---|---|
| `HBAG-PRODUCTS-CATALOG-COMPLETENESS` | HBAG | PRODUCTS | ~14 product issues | Product data validation, image presence |
| `BRIK-PRODUCTS-RECEPTION-UI-QUALITY` | BRIK | PRODUCTS | ~18 theming issues | Contrast sweep, breakpoint sweep output |
| `PWRB-ASSESSMENT-READINESS` | PWRB | STRATEGY | ~5 pre-launch gaps | Assessment stage completion state |

## Impact Projection

If Priority 1 artifacts were created and registered:
- **~115 dispatches** (32% of clean queue) could have been auto-detected instead of manually reported
- **4 businesses** (BRIK, HBAG, XA, BOS) would have automated problem detection
- The operator_idea to artifact_delta ratio would shift from 96%/4% toward ~70%/30%

## Actionable Backlog Summary

The 61 enqueued dispatches break down as:
- **43 fact_find_ready** — need investigation before planning
- **14 micro_build_ready** — directly executable without planning
- **4 completed** — stale queue entries (already processed but state not updated)

The 4 stale "completed" entries in enqueued state are a minor data quality issue — they have `status: completed` but `queue_state: enqueued`. These should be reconciled in a future queue maintenance pass.
