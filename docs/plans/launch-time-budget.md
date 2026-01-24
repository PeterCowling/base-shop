---
Type: Reference
Status: Active
Domain: Launch
Created: 2026-01-23
Created-by: Claude Opus 4.5
Last-reviewed: 2026-01-23
---

# Launch Time Budget

This document defines the time budget for launching a Basic tier shop. It specifies what work is included in the budget, what is excluded as prerequisites, and how the launch window is allocated across stages.

## Basic Tier Constraints

| Constraint | Bound | Rationale |
|---|---|---|
| Products | ≤5 routed to shop | Keeps routing a checkbox exercise |
| Locale | Single (one language, one currency) | Eliminates translation decisions |
| Template options | 1 per type (approved default) | Eliminates comparison time; override available |
| Operator | Single, trained shop owner (or admin acting as owner) | No mid-session handoffs; admin setup is a prerequisite |
| Stripe | Centralized account (shared, admin-provisioned) | No per-shop Connect setup during launch |
| Pages | Template-derived; bounded edits allowed | No required content authoring; optional inline edits (≤10 text fields) during Review |
| Theme options | 1–2 in registry | Minimal browsing time |

If any constraint is exceeded, the time targets do not apply without re-estimation.

---

## Target Time

| Metric | Target | Ceiling |
|---|---|---|
| **Operator-active time** | **45 minutes** | 90 minutes |
| End-to-end elapsed (including waits) | Reported, no SLA | — |

**Operator-active time** = time the operator spends interacting with the CMS (clicking, typing, reviewing). It excludes infrastructure waits, external API processing, and idle pauses. This is not wall-clock time.

**A launch typically requires 45 minutes of operator effort; elapsed time depends on infrastructure waits (deploys, DNS, TLS) and may be significantly longer.**

The 45-minute target assumes the operator knows their shop (name, products, brand). They are making bounded selections, not open-ended decisions. The 90-minute ceiling covers recovery from a single failure cycle.

---

## Three-Stage Launch

The launch is a single continuous session in the CMS UI, divided into three stages:

```
┌─────────────────────────────────────────────────────────────┐
│  PREREQUISITES (before session)                              │
│  Products inventoried ✓  Accounts verified ✓                 │
│  Templates approved ✓  Brand assets ready ✓                  │
└─────────────────────────────────────────────┬───────────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │  PREFLIGHT         │
                                    │  (automated, <1m)  │
                                    └─────────┬─────────┘
                                              │ PASS
                              ┌───────────────▼───────────────┐
                              │         CLOCK STARTS           │
                              └───────────────┬───────────────┘
                                              │
                 ┌────────────────────────────▼────────────────────────────┐
                 │  Stage 1: CONFIGURE (15 min)                            │
                 │  Unified wizard: identity → theme → products →          │
                 │  commerce → compliance                                  │
                 └────────────────────────────┬────────────────────────────┘
                                              │
                 ┌────────────────────────────▼────────────────────────────┐
                 │  Stage 2: REVIEW (15 min)                               │
                 │  Generated pages, navigation, checkout preview          │
                 │  (content derivation runs automatically between stages) │
                 └────────────────────────────┬────────────────────────────┘
                                              │
                 ┌────────────────────────────▼────────────────────────────┐
                 │  Stage 3: LAUNCH (10 min)                               │
                 │  Deploy → E2E gates → sign-off → production → verify   │
                 └────────────────────────────┬────────────────────────────┘
                                              │
                              ┌───────────────▼───────────────┐
                              │  SHOP IS LIVE                  │
                              │  (acceptance test passes)      │
                              └───────────────────────────────┘

Buffer: 5 min (included in 45-min target)
```

---

## Stage 1: Configure (15 min)

A single CMS wizard flow. The operator progresses through steps without leaving the UI. Each step presents the approved default with an option to override.

### Wizard Steps

| Step | What the operator does | Decision count | Target |
|---|---|---|---|
| Shop identity | Types name; slug auto-derived; picks locale + currency from dropdown | 3 fields | 2 min |
| Theme + brand | Sees default theme preview; uploads logo, favicon source, social image; optionally picks alt color | 1 selection + 3 uploads + 0–1 override | 5 min |
| Products | Checks ≤5 products from central catalog list (name, image, price visible inline) | ≤5 checkboxes | 2 min |
| Commerce | Confirms payment template (default); picks shipping template (1–2 options); confirms VAT | 2–3 selections | 3 min |
| Compliance | Confirms legal bundle (default); confirms consent template; reviews auto-derived SEO title/desc | 2 confirmations + 1 review | 3 min |

**Total: 15 minutes.**

### Why each step is fast

- **Identity**: slug auto-derives; locale/currency are single dropdowns (single-locale constraint)
- **Theme**: default is pre-selected; brand kit is 3 file drops; override is optional single color picker
- **Products**: ≤5 items from a pre-filtered list showing only routable products with complete metadata
- **Commerce**: defaults are pre-selected; operator confirms or picks from ≤2 alternatives
- **Compliance**: defaults are pre-selected; SEO is auto-derived (operator just reads it)

### What the wizard produces

A complete launch config object (in-memory, not a file the operator edits):
```
{ shop, theme, brandKit, products[], commerce, compliance, seo }
```

This is passed directly to the content derivation engine.

---

## Stage 2: Review (15 min)

Content derivation runs automatically (<10 seconds) when the operator advances past Stage 1. The CMS displays the generated shop for review.

### What the operator reviews

| Review item | Presentation | What they're checking | Target |
|---|---|---|---|
| Home page | Full preview in CMS | Hero image, product grid, brand name correct | 3 min |
| Product pages (≤5) | Thumbnail grid, click to expand | Images, prices, descriptions, variants correct | 4 min |
| Category page | Preview | Products listed, category name correct | 1 min |
| Content pages (about, contact, shipping/returns) | Preview list | Content derived correctly from config + templates | 2 min |
| Legal pages (terms, privacy, accessibility) | Checklist with expand | Correct legal bundle applied; content present | 1 min |
| FAQ/Size Guide | Preview | Correct attributes shown; missing data handled | 1 min |
| Navigation | Header/footer preview | Links present and correct | 1 min |
| Checkout preview | Static layout preview | Checkout page structure correct; shipping/tax template names shown; Stripe integration verified by gate in Stage 3 | 1 min |
| Consent banner | Preview | Cookie consent template applied | 0.5 min |

**Total: ~14.5 minutes review + up to ~3 minutes inline edits if needed.**

The review item times are upper bounds. An efficient operator scanning confirmed-correct pages will complete faster, leaving time for inline edits within the 15-minute stage budget. If both full review time AND edits are needed, the operator uses the 5-minute buffer.

### Pages created in Basic rapid launch

The following pages are created and must all return 2xx at acceptance:

**Fixed pages (9):**
1. Home (`/`)
2. Category/Shop (`/shop`)
3. About (`/about`)
4. Contact (`/contact`)
5. FAQ (`/faq`)
6. Shipping & Returns (`/shipping-returns`)
7. Terms & Conditions (`/terms`)
8. Privacy Policy (`/privacy`)
9. Accessibility (`/accessibility`)

**Product pages (1–5, one per selected product):**
10–14. Product detail (`/shop/<slug>`)

**Total page count: 10–14** (9 fixed + 1–5 products).

Legal pages (7–9) are derived from the selected legal bundle. They are real pages, not modals or hosted docs.

### Content derivation sources (all resolved from Stage 1)

| Page | Derives from | Fallback |
|---|---|---|
| Home | Products + brand kit + shop name | Generic hero with brand name |
| Category/PLP | Products + routing | Single "All Products" category |
| Product/PDP | Product data (name, desc, images, price, variants) | n/a — products are a prerequisite |
| About | Shop name + description | Template default with shop name substituted |
| Contact | Contact details + support email | Template default with email only |
| FAQ/Size Guide | Product attributes (sizes, materials, weights) | Omit empty sections; "Contact us" fallback |
| Shipping/Returns | Shipping template + returns policy | Verbatim from selected templates |
| Terms & Conditions | Legal bundle (terms type) | Verbatim from bundle; no derivation logic |
| Privacy Policy | Legal bundle (privacy type) | Verbatim from bundle; no derivation logic |
| Accessibility | Legal bundle (accessibility type) | Verbatim from bundle; no derivation logic |

### Editing during review

Inline edits are **allowed but not required**. The system aims for zero edits (given complete product metadata). When edits are needed, they are bounded:

- **Scope**: text content only (headings, descriptions, body copy). No image/layout/component changes.
- **Bound**: ≤10 text fields per launch. The UI tracks edit count; exceeding 10 triggers a warning suggesting prerequisite data improvement.
- **Budget**: edits are included in the 15-minute Review budget, not treated as buffer.

Recovery actions if the operator spots issues:
- **Wrong product selection**: back to Stage 1 products step (adds ~2 min, consumes buffer)
- **Theme looks wrong**: back to Stage 1 theme step, adjust color (adds ~2 min, consumes buffer)
- **Content derivation poor**: inline text edits in review (~3 min, typically absorbed in review time; may consume buffer if review was already at limit)
- **Major derivation failure**: indicates a prerequisite gap (product metadata incomplete) — should have been caught by preflight

---

## Stage 3: Launch (10 min)

The operator clicks "Launch" in the CMS. Everything from here is automated with the operator monitoring progress.

### Launch sequence

| Step | Operator action | System action | Target |
|---|---|---|---|
| Initiate | Clicks "Launch to preview" | Scaffold + CI + deploy triggered | 10 sec |
| Wait for preview | Watches progress indicator | Build + deploy runs (excluded from SLA) | — |
| Gates run | Reviews pass/fail list | 6 automated gates execute against preview | 2 min |
| Results review | Reads gate results; all green → proceeds | Gates surface any failures with actionable messages | 2 min |
| Sign-off | Checks confirmation boxes (owner = operator for Basic) | Checklist presented | 1 min |
| Production | Clicks "Go live" | DNS cutover + production deploy triggered | 10 sec |
| Wait for production | Watches progress indicator | Deploy + DNS (excluded from SLA) | — |
| Acceptance | Reads final status: "Live ✓" or failure details | Automated acceptance test runs | 2 min |
| Done | Sees live URL + launch report | Report written | — |

**Operator-active time in Stage 3: ~10 minutes** (excluding deploy waits).

---

## Budget Summary

| Stage | Target | Cumulative |
|---|---|---|
| 1. Configure | 15 min | 15 min |
| 2. Review | 15 min | 30 min |
| 3. Launch | 10 min | 40 min |
| Buffer | 5 min | **45 min** |

---

## What "Live" Means (Acceptance Criteria)

The clock stops when the automated acceptance test confirms:

1. Production domain serves the shop (HTTPS, valid TLS)
2. All pages (9 fixed + N product pages, see "Pages created" above) return 2xx
3. Test checkout: add to cart → Stripe checkout session created successfully
4. Inventory hold created on checkout start
5. Webhook endpoint responds to synthetic signed test payload (system-generated, not Stripe-emitted)
6. Order confirmation email template renders (SPF + DKIM records verified for sender domain)

### Stripe mode at go-live

Production launches in **Stripe test mode**. This validates the full checkout flow (session creation, webhook delivery, hold mechanics) without real charges. Promotion to Stripe live mode is a separate operational step performed after launch acceptance, outside the SLA.

This means acceptance test #3 validates: API keys configured → session object created → correct line items and amounts. It does not validate live payment processing.

**Not required at clock-stop** (follows within hours):
- Stripe live mode activation (separate step)
- Real payment with live card
- Full DNS propagation globally
- Search engine indexing

---

## SLA Boundary Rules

| Activity | Counted? | Rationale |
|---|---|---|
| Operator clicking, typing, reviewing in CMS | Yes | Active work |
| Content derivation processing (<10 sec) | Yes | Brief wait; operator sees progress |
| Gate execution (~30–60 sec, results stream in) | Yes | Operator actively reads results as they appear |
| Operator reviewing gate results / sign-off | Yes | Active decision-making |
| Preview environment becoming reachable | No | External infrastructure (deploy wait) |
| CI build + deploy execution | No | External infrastructure (deploy wait) |
| DNS propagation | No | External infrastructure |
| TLS certificate issuance | No | External infrastructure |
| Stripe/webhook processing during gates | No | External API (included in gate execution interval, but gate interval itself is counted) |
| Background jobs (images, cache) | No | Async, non-blocking |
| Operator breaks (idle >5 min) | No | Clock pauses |
| Preflight execution | No | Runs before clock |

**Note on gate execution**: gate execution time (typically 30–60 sec) is counted as operator-active because results stream to the UI in real-time and the operator reads them as they arrive. The operator is not idle during gate execution — they are monitoring a live feed. Only the deploy *wait* (before gates can start) is excluded.

### Measurement Specification

The CMS UI records timestamps at wizard step transitions and button clicks. The server records phase-level timestamps for infrastructure operations. Both are combined in the launch report.

**Formal definitions:**

```
endToEndElapsedMs = t_acceptancePass - t_preflightStart

operatorActiveMs  = endToEndElapsedMs - excludedWaitMs - pauseMs

excludedWaitMs    = Σ(deployWaitIntervals)
                  where each interval is [phaseStart, phaseEnd] from server events:
                    • preview deploy wait (deploy.preview.start → deploy.preview.ready)
                    • production deploy wait (deploy.production.start → deploy.production.ready)
                  Note: TLS issuance and DNS propagation are subsumed within deploy wait
                  intervals (deploy is not "ready" until URL is reachable over HTTPS).
                  Gate execution is NOT excluded (operator actively reads streaming results).

pauseMs           = Σ(idleIntervals)
                  where idle = no UI interaction event for >5 continuous minutes
                  UI interaction = any of: click, keypress, scroll, drag, focus change
                  Maximum 3 pauses per launch session; >3 pauses flags the report
```

**Events that define interval boundaries** (server-side, streamed to client):

| Event | Source | Marks | Used in |
|---|---|---|---|
| `preflight.start` | Server | Start of end-to-end clock | `endToEndElapsedMs` start |
| `deploy.preview.start` | Server | Start of preview deploy wait | `excludedWaitMs` interval start |
| `deploy.preview.ready` | Server | Preview URL reachable (HTTPS, valid TLS) | `excludedWaitMs` interval end |
| `gates.start` | Server | Gates begin executing | Reporting only (not excluded) |
| `gates.complete` | Server | All 6 gates finished | Reporting only (not excluded) |
| `deploy.production.start` | Server | Start of production deploy wait | `excludedWaitMs` interval start |
| `deploy.production.ready` | Server | Production URL reachable (HTTPS, DNS resolved, valid TLS) | `excludedWaitMs` interval end |
| `acceptance.pass` | Server | End of end-to-end clock | `endToEndElapsedMs` end |
| `ui.stepTransition` | Client | Stage/step timing | Per-stage breakdown |
| `ui.idle.start` / `ui.idle.end` | Client | Pause detection | `pauseMs` intervals |

**"Ready" means**: the URL responds to an HTTPS GET with a valid TLS certificate. This subsumes DNS propagation and TLS issuance — they are not measured as separate intervals.

**Idle detection events**: `ui.idle.start` fires after 5 continuous minutes with no click, keypress, scroll, drag, or focus-change event. `ui.idle.end` fires on the next such event. Mouse movement alone does not count (prevents false negatives from accidental mouse bumps).

**SLA compliance**: `operatorActiveMs <= 2_700_000` (45 min target) or `operatorActiveMs <= 5_400_000` (90 min ceiling).

---

## Prerequisites (Outside the Launch Window)

Prerequisites are split between two roles. The **CMS administrator** configures platform infrastructure and hands off a launch-ready environment to the **shop owner**, who then completes shop-specific setup and runs the rapid-launch wizard.

### Roles

| Role | Who | Responsibilities | CMS access level |
|---|---|---|---|
| **Administrator** | Platform operator / DevOps | Infrastructure, integrations, templates, compliance | Full CMS access (all shops) |
| **Shop Owner** | Merchant / store operator | Products, brand, business details | Single-shop access (their shop only) |

The administrator CAN complete shop owner tasks (e.g., add products on behalf of an owner). The shop owner CANNOT complete administrator tasks (e.g., configure Stripe, manage DNS). The rapid-launch wizard itself is run by the shop owner (or an administrator acting on their behalf).

### Handoff process

```
┌──────────────────────────────────────────────┐
│  ADMINISTRATOR SETUP (days/weeks before)      │
│                                               │
│  1. Provision shop record in CMS              │
│  2. Connect Stripe (OAuth)                    │
│  3. Configure domain + DNS                    │
│  4. Verify email sender (SPF/DKIM)            │
│  5. Activate shipping carrier                 │
│  6. Ensure templates/themes/legal are ready   │
│                                               │
│  → Invites shop owner to CMS (single-shop)    │
└──────────────────────┬───────────────────────┘
                       │ HANDOFF
┌──────────────────────▼───────────────────────┐
│  SHOP OWNER SETUP (days before launch)        │
│                                               │
│  1. Add products to central inventory         │
│  2. Prepare brand assets (logo, favicon, OG)  │
│  3. Set support email + returns address       │
│                                               │
│  → Opens rapid-launch wizard (preflight runs) │
└──────────────────────────────────────────────┘
```

### Administrator prerequisites

These require platform-level access and are invisible to the shop owner except as pass/fail in preflight.

| Prerequisite | Readiness criteria | Where configured |
|---|---|---|
| Stripe account | Verified; correct mode; webhook endpoint configured | CMS: `/cms/rapid-launch/setup/payment-provider` (OAuth flow) |
| Domain | Registered; Cloudflare zone exists; DNS records point to platform | CMS: `/cms/rapid-launch/setup/hosting` (domain input + DNS polling) |
| Email sender | SPF + DKIM records resolve for sender domain | CMS: `/cms/shop/[shop]/settings/email-sender` (verification UI) |
| Shipping carrier | Active; rate table configured | CMS: `/cms/rapid-launch/setup/shipping` |
| Templates | ≥1 per content page type (7 types); legal bundle content in standard layout | Platform-maintained (developer task) |
| Themes | ≥1 complete theme with preview assets, tagged `rapidLaunch: true` | Platform-maintained (developer task) |
| Compliance templates | All 6 types (terms, privacy, returns, accessibility, consent, VAT) | Platform-maintained (legal review) |
| Commerce templates | ≥1 payment + ≥1 shipping, tagged `rapidLaunch: true` | Platform-maintained (developer task) |

### Shop owner prerequisites

These require only single-shop access and are the owner's responsibility after handoff.

| Prerequisite | Readiness criteria | Where configured |
|---|---|---|
| Products in central inventory (≤5) | **Required:** Name, description, ≥1 image, price, SKU, ≥1 variant (or explicit none), inventory > 0. **Recommended:** weight, dimensions, sizes, materials (improves FAQ/shipping derivation; omission triggers fallbacks, not failures) | CMS: `/cms/shop/[shop]/data/inventory` |
| Brand assets | Logo (SVG + PNG), favicon (≥512px), social/OG image (1200×630) — on operator's machine | Prepared locally, uploaded during Stage 1 Step 2 |
| Support email | Configured, reachable | CMS: `/cms/shop/[shop]/settings` (shop editor) |
| Returns address | Defined | CMS: `/cms/shop/[shop]/settings` (shop editor) |
| Owner available | Same person as operator (Basic tier) or on-call | — |

### Preflight behavior by role

When the shop owner opens the rapid-launch wizard, preflight checks ALL prerequisites (both admin and owner). The behavior differs by which role's responsibility it is:

| Check fails for | What the owner sees | Fix action |
|---|---|---|
| **Owner prerequisite** | Red item with "Fix" link → navigates to the relevant setup screen | Owner fixes it themselves |
| **Admin prerequisite** | Red item with "Contact administrator" message (no Fix link) | Owner cannot fix — must wait for admin to resolve |

If an administrator opens the rapid-launch wizard, all failing checks show "Fix" links regardless of role (the admin has access to everything).

The rapid-launch wizard does not handle prerequisite setup — it only consumes pre-configured state. See [launch plan Task 5.3](launch-3hr-v2-plan.md#task-53-prerequisite-setup-flows-fix-link-targets) for the implementation of fix links, setup screens, and role-based routing.

---

## Failure Scenarios & Recovery

| Failure | Time cost | Recovery |
|---|---|---|
| Theme preview looks wrong | +2 min | Back to wizard theme step, adjust color |
| Wrong products selected | +2 min | Back to wizard products step |
| Content derivation poor quality | +3 min | Inline text edit in review |
| Gate failure (checkout) | +5–10 min | Error message → fix in wizard → re-launch |
| Gate failure (missing page) | +3 min | Back to review, regenerate |
| Deploy failure | +0 min (retry automatic) | System retries; operator waits |
| Prerequisites discovered missing | **Abort** | Should not happen (preflight catches) |

**Ceiling scenario**: One gate failure + one content fix + buffer = ~55 min. Two failures = ~65 min. The 90-minute ceiling covers worst-case with multiple recoveries.

---

## Exclusions Recap

Not part of the launch window:

**Administrator setup (before handoff):**
1. Stripe account provisioning (KYC, OAuth connection, webhook configuration)
2. Domain registration + Cloudflare zone creation + DNS configuration
3. Email sender verification (SPF/DKIM records)
4. Shipping carrier activation + rate table configuration
5. Template authoring (themes, pages, legal bundles)
6. Legal review (compliance template approval)
7. Shop record creation + owner invitation

**Shop owner setup (after handoff, before launch session):**
8. Product creation (photography, copywriting, data entry into central inventory)
9. Brand asset creation (logo, favicon, OG image)
10. Business details (support email, returns address)

**Infrastructure (during launch, excluded from operator-active time):**
11. CI/deploy execution time
12. DNS propagation
13. TLS issuance
14. External API processing

**Operational:**
15. Operator training
16. Operator breaks (clock pauses)
17. Preflight execution

---

## Metrics & Measurement

Each launch produces a report recording:

- Per-stage timestamps (wizard transitions, review actions, launch button clicks)
- `operatorActiveMs` (active UI interaction, excludes pauses + infrastructure waits)
- `endToEndElapsedMs` (wall-clock from preflight to acceptance)
- `excludedWaitMs` and `pauseMs` breakdown
- Gate results with per-gate timestamps
- Retry/recovery events with cost breakdown
- Content derivation duration
- Number of inline edits made during review

| Metric | Target | Ceiling | Measurement |
|---|---|---|---|
| Operator-active time | 45 min | 90 min | See Measurement Specification above |
| End-to-end elapsed | Reported, no SLA | — | Wall-clock from preflight to acceptance |

---

## Related Documents

- [Launch Plan (v2)](launch-3hr-v2-plan.md) — implementation plan
- [Launch Shop Runbook](../runbooks/launch-shop-runbook.md) — operator guide
- [CMS Fast-Launch Master Thread](../cms-plan/master-thread.fast-launch.md) — CMS configurator vision
