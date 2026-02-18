---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI | SEO | Analytics | Integration
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17
Last-reviewed: 2026-02-17
Feature-Slug: brikette-octorate-funnel-reduction
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-design-spec,lp-seo
Related-Plan: docs/plans/brikette-octorate-funnel-reduction/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: BRIK-ENG-0021
Relates-to charter: docs/business-os/business-os-charter.md
Relates-to:
  - docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md
  - docs/business-os/strategy/BRIK/2026-02-17-octorate-process-reduction-feasibility.user.md
  - docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md
---

# Brikette Octorate Funnel Reduction Fact-Find Brief

## Scope
### Summary
This fact-find converts the external funnel brief and Octorate feasibility evidence into a planning-ready packet for a Brikette-first booking funnel: move discovery/selection to first-party SSR pages and keep Octorate as final transactional checkout.

As of February 17, 2026, feasibility risk is lower than decision risk. The key policy choices are now explicitly set for handoff endpoint/mode, no-API availability, completion closure, and redirect/canonical scope.

### Why Now / Cost of Inaction
- `/{lang}/book` SSR weakness creates dead-funnel risk under JS/performance regressions.
- i18n token leakage in crawler-visible HTML degrades trust and can reduce SERP click-through quality.
- `/book` 404 orphan behavior leaks campaign traffic and weakens route health.
- Without booking completion closure, optimization remains limited to pre-handoff proxies rather than true booked revenue.

### Goals
- Establish an evidence-backed target model: Brikette-first discovery/selection, Octorate last-mile checkout.
- Define what should be moved off Octorate now vs deferred.
- Stabilize route health (`/{lang}/book` quality and `/book` canonical redirect behavior).
- Upgrade GA4 taxonomy for pre-handoff diagnostics with explicit handoff semantics.
- Define a minimum viable booking completion closure path with measurable join-rate targets.

### Non-goals
- Replacing Octorate transactional checkout in this phase.
- Rebuilding Octorate's JSF/PrimeFaces mid-flow state machine via deep links.
- Launching a first-party PCI/payment tokenization stack.

### Constraints & Assumptions
- Hard constraints:
  - Octorate checkout remains external and minimally controllable.
  - Multilingual route and slug architecture must be preserved.
  - Consent posture remains Consent Mode v2 default-deny.
  - No PCI-scoped checkout build in this phase.
  - No Octorate API or webhook access is available for BRIK in this phase.
- Operating principles:
  - Prefer low-risk, high-leverage changes first.
  - Keep Phase 1 strictly API-independent.
  - Keep SSR-first quality for commercial landing routes.
  - Avoid brittle deep-link/state-replay into Octorate mid-flow.
- Assumptions:
  - Octorate API/webhook capability exists in public spec but is out-of-scope until access changes.
  - Completion/revenue closure in this scope must rely on export/import reconciliation, not live API callbacks.
  - Existing GA4 pre-handoff instrumentation can be upgraded without platform rewrite.

## Evidence Audit (Current State)
### Entry Points
- `https://hostel-positano.com/{lang}` - modal-first entry via header/hero/widget.
- `https://hostel-positano.com/{lang}/book` - current booking route with weak SSR booking usability.
- `https://hostel-positano.com/{lang}/apartment/book` - same-tab handoff path with visible SSR content.
- `https://hostel-positano.com/book` - orphan route (404).
- Octorate handoff endpoints:
  - `https://book.octorate.com/octobook/site/reservation/result.xhtml`
  - `https://book.octorate.com/octobook/site/reservation/confirm.xhtml`

### Reproducibility Snapshot
- Repro 1: booking route hydration dependence.
  - `curl -sL https://hostel-positano.com/en/book | rg -n "BAILOUT_TO_CLIENT_SIDE_RENDERING|check availability|book"`
  - Expected baseline: shell-heavy HTML and bailout marker, with booking UX appearing only after hydration.
- Repro 2: i18n leakage on commercial routes.
  - `curl -sL https://hostel-positano.com/en/ | rg -n "booking\\.|book\\.|heroTitle|checkAvailability"`
  - `curl -sL https://hostel-positano.com/en/apartment/book | rg -n "book\\.|heroTitle|checkAvailability"`
  - Expected baseline: unresolved token-like strings present in server HTML.
- Repro 3: orphan route.
  - `curl -I https://hostel-positano.com/book`
  - Expected baseline: HTTP 404.

### Key Modules / Files
- `docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md` - rendering matrix, click map, GA4 boundaries.
- `docs/business-os/strategy/BRIK/2026-02-17-octorate-process-reduction-feasibility.user.md` - Playwright + HTML + OpenAPI feasibility.
- `docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md` - GA4 setup baseline and known limitations.
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` - booking route UI/event entry point.
- `apps/brikette/src/context/modal/global-modals/BookingModal.tsx` - generic booking modal behavior.
- `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx` - room/rate modal behavior.
- `packages/ui/src/organisms/modals/BookingModal.tsx` - UI booking modal behavior.
- `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx` - apartment booking handoff behavior.
- `apps/brikette/src/utils/ga4-events.ts` - pre-handoff event contract surface.
- `.tmp/octorate-funnel-probe-2026-02-17/report.json` - probe evidence of Octorate stateful flow.

### Patterns & Conventions Observed
- Hybrid funnel pattern: modal-first interactions plus language-prefixed booking pages.
- `/{lang}/book` is hydration-dependent for meaningful booking UI at baseline.
- Mixed handoff modes are live (`new_tab` and `same_tab`).
- Octorate flow is stateful JSF/PrimeFaces (`octobooksessionid`, `jakarta.faces.ViewState`).
- Deep-link behavior beyond supported entry points is brittle.
- i18n token leakage appears in server HTML on commercial routes.

### Octorate Integration Rules (from Evidence)
- DO:
  - Deep-link only to deterministic entry points (`result.xhtml`, optionally `confirm.xhtml` when explicitly proven stable for given context).
  - Keep integration API-independent in this phase; use Octorate exports for post-handoff reconciliation.
  - Keep handoff metadata explicit (`engine_endpoint`, `handoff_mode`, `handoff_stage`).
- DON'T:
  - Build integration by replaying JSF `ViewState` tokens.
  - Depend on mid-flow URLs such as `calendar.xhtml;octobooksessionid=...` as stable contracts.
  - Treat Octorate UI scraping/state automation as a long-term transaction integration strategy.

### Data & Contracts
- Current first-party observability:
  - Observable: `search_availability`, `view_item_list`, `view_item`, `select_item`, handoff intent (`begin_checkout`/handoff click).
  - Unobservable from current web-only instrumentation: booking confirmation, revenue closure, cancel/refund lifecycle.
- GA4 Admin API snapshot (checked 2026-02-17 09:54 UTC):
  - Property: `properties/474488225`
  - Web stream: `properties/474488225/dataStreams/10183287178` (`G-2ZSYXG8R7T`)
  - Key events: `purchase`, `begin_checkout`, `click_whatsapp`, `click_check_availability`
  - Conversion events: `purchase`, `begin_checkout`, `click_whatsapp`, `click_check_availability`
- GA4 Tag Settings UI snapshot (checked 2026-02-17 via Admin screenshots):
  - Unwanted referrals list: no domains configured (empty).
  - Cross-domain linking include list: no domains configured; suggestions shown for `hostel-positano.com` and `brikette-website.pages.dev` are not accepted yet.
  - Tag quality diagnostics: two active issues (`Some of your pages are not tagged`, `Additional domains detected for configuration`).
- GA4 `See untagged pages` snapshot (owner-provided, 2026-02-17):
  - Includes preview-domain URL(s) on `8a8eb612.brikette-website.pages.dev`.
  - Includes a large cluster of non-canonical localized or legacy routes across `de`, `en`, `es`, `fr`, `it`, `ja`, `ko`, `pt`, `ru`, `zh`.
  - Includes many malformed cross-locale slug combinations (for example mixed `hilfezentrum`/`ayuda`/`pomosh`/`shien` path segments), indicating strong redirect/canonical debt and legacy crawl residue.
  - Representative spot-check (13 URLs) shows mixed HTTP outcomes (`200`, `308`, `404`) with GA tag string present in returned HTML, so this diagnostic set is not equivalent to "all currently tag-missing production pages."
- Event taxonomy target:
  - Canonical handoff event: `handoff_to_engine`.
  - Required params: `source`, `handoff_mode`, `engine_endpoint`, `checkin`, `checkout`, `pax`.
  - Optional params: `item_list_id`, `items[]`, `handoff_stage`.
  - `begin_checkout` retained only as migration compatibility event.
- Booking URL contract target:
  - Canonical localized booking routes as source of truth.
  - Minimum immediate rule: `308 /book -> /en/book` with exact query preservation.
  - Redirect map for trailing slash, locale alias, and known legacy near-miss booking paths.
- Octorate API capability evidence (`.tmp/octorate-openapi.yaml`):
  - Availability checks, reservation operations, webhooks, payment/tokenization constraints.
- Octorate reservations export sample (local artifact check, 2026-02-17):
  - File: `packages/mcp-server/.tmp/octorate-downloads/2026-02-14T21-11-05_1771103464860.xlsx`
  - Sheet headers observed: `Create time`, `Check in`, `Guest`, `Refer`, `Guests`, `Nights`, `Room`, `Total Room`, `Email`.
  - No explicit cancellation/refund/status columns are present in this current export profile.

### External Data Access Checks (2026-02-17)
- Search Console API check:
  - Result: accessible after permission grant (`sites.list` now returns `sc-domain:hostel-positano.com` with `siteFullUser`).
  - Page-level extract is now available via `searchanalytics.query` (79 page rows in sampled window; 35 booking-like paths).
  - Snapshot artifact: `.tmp/search-console-hostel-pages-2025-11-01_2026-02-17.json`.
  - Limitation: current `googleapis` webmasters surface in this runtime exposes `sites`, `sitemaps`, and `searchanalytics`, but not `urlcrawlerrorssamples`.
- Cloudflare API check:
  - Result: restored in this runtime with a dedicated scoped API token configured in `.env.local` (`CLOUDFLARE_API_TOKEN`).
  - Validation:
    - `pnpm brik:export-cloudflare-proxies --zone-name hostel-positano.com --hostname hostel-positano.com --months 2 --dry-run` succeeded on 2026-02-17.
    - One-day top-404 path pull succeeded; snapshot saved at `.tmp/cloudflare-top-404-2026-02-16.json` (`50` rows).
    - Seven-day top-404 rollup succeeded; snapshot saved at `.tmp/cloudflare-top-404-rollup-2026-02-10_to_2026-02-17.json` (`200` aggregated URLs).
  - Limitation: Cloudflare GraphQL `httpRequestsAdaptiveGroups` window is capped at `86400s`, and this zone token context cannot query older than `691200s` (~8 days), so multi-day 404 analysis must be rolled up day-by-day on a short cadence.
- GA4 paid-landing extraction check:
  - Result: no paid/cpc/ppc mediums observed in sampled property traffic (query window expanded to `2024-01-01` to `2026-02-17`).
  - Observed session mediums: `(none)`, `organic`, `(not set)`, `referral`, `social`.
  - Impact: paid destination mapping is N/A for current phase (owner confirmed no active paid campaigns on 2026-02-17); re-open only if campaigns are reactivated.
- GA4 event-surface check:
  - Result: event stream currently contains only baseline/enhanced events (`page_view`, `user_engagement`, `scroll`, `session_start`, `first_visit`, `click`); no observed `begin_checkout` or `handoff_to_engine` rows in sampled API reports.
  - Admin state mismatch: `begin_checkout` is configured as key/conversion event, but no event rows were returned in current API snapshots.
  - Impact: calibration work is blocked by missing observable handoff-event data, not only by reconciliation method choice.
- Calibration attempt (2026-02-10 to 2026-02-17):
  - Octorate export provided by owner and parsed successfully:
    - file: `/Users/petercowling/Downloads/1771331323819.xlsx`
    - rows: `36` raw, `31` deduped bookings (dedupe key: create-day + `Refer`)
    - deduped value: `8682.99`
  - GA4 Data API for same window returned `page_view` only (`266`) and zero handoff-intent events:
    - `begin_checkout=0`
    - `handoff_to_engine=0`
    - `search_availability=0`
    - `click_check_availability=0`
  - Result:
    - aggregate reconciliation coverage cannot be computed yet from GA4 handoff events (denominator is zero),
    - probabilistic join precision cannot be computed yet (no GA4 handoff rows to join).
    - next calibration must use an overlapping date window where both sources are non-zero (GA4 handoff events and Octorate created bookings); this window can be historical and does not need to be future-dated.
  - Artifacts:
    - `.tmp/reconciliation-2026-02-10_2026-02-17/octorate-bookings-by-create-day.csv`
    - `.tmp/reconciliation-2026-02-10_2026-02-17/octorate-bookings-summary.json`
    - `.tmp/reconciliation-2026-02-10_2026-02-17/ga4-events-by-day-2026-02-10_2026-02-17.csv`
    - `.tmp/reconciliation-2026-02-10_2026-02-17/ga4-events-by-day-2026-02-10_2026-02-17.json`
    - `.tmp/reconciliation-2026-02-10_2026-02-17/calibration-summary.md`
- GA4 admin configuration update (2026-02-17, API-applied):
  - Event create rules added on stream `properties/474488225/dataStreams/10183287178`:
    - `begin_checkout` -> `handoff_to_engine`
    - `search_availability` -> `handoff_to_engine`
  - Parameter mutations applied on created event:
    - `handoff_mode=unknown`
    - `handoff_stage=pre_checkout`
    - `legacy_event=<source event>`
    - `engine_endpoint=unknown` for `begin_checkout`, `engine_endpoint=result` for `search_availability`
  - Custom dimensions created for:
    - `handoff_mode`, `engine_endpoint`, `handoff_stage`, `legacy_event`, `checkin`, `checkout`, `pax`
  - Key event created: `handoff_to_engine`
  - Live validation:
    - Manual browser emit confirmed on live site (`window.gtag('event','begin_checkout', ...)` and `window.dataLayer` inspection).
    - GA4 Realtime Data API check returned non-zero rows for both `begin_checkout` and `handoff_to_engine` on 2026-02-17.
  - Remaining action: allow standard processing lag, then confirm stable reporting-table visibility over the next daily window.

### Octorate Onboarding Verification Status (2026-02-17)
- Status: unavailable for this work phase (explicitly confirmed by owner).
- Verification checks run:
  - Environment check found no local Octorate API credential vars configured in this agent run (`OCTORATE_API_KEY`, `OCTORATE_ACCESS_TOKEN` unset).
  - MCP session check failed: `octorate_calendar_check` returned missing storage state (`.secrets/octorate/storage-state.json` not found).
  - Repository search found Octorate REST/webhook capability references in docs/spec, but no committed BRIK-specific webhook registration artifact or active Octorate REST client integration in Brikette runtime paths.
- Decision impact:
  - Phase-1/Phase-2 scope is reduced to API-independent work. API/webhook integration is deferred and non-blocking for the reduced plan.

### Dependency & Impact Map
- Upstream dependencies:
  - Next.js route rendering behavior on commercial routes.
  - Existing modal architecture and CTA routing.
  - GA4 instrumentation wrappers and consent behavior.
  - Octorate endpoint stability and export data availability.
- Downstream dependents:
  - SEO landing quality and paid landing reliability.
  - Funnel diagnosability and optimization cadence.
  - Booking operations reconciliation.
- Likely blast radius:
  - Booking routes, redirect rules, CTA components, analytics schema, integration adapters.

### Security & Performance Boundaries
- Security boundary:
  - Payment transaction remains in Octorate in Phase 1.
  - Any move to full checkout replacement introduces PCI/tokenization scope.
- Performance boundary:
  - Hydration dependency on booking-critical routes creates dead-funnel exposure.
  - SSR-first booking discovery improves crawler-visible quality and no-JS resilience.

### Delivery & Channel Landscape
- Audience/recipient:
  - Growth/SEO, product, analytics, operations, and external reviewer.
- Channel constraints:
  - Multilingual URL stability is mandatory.
  - Handoff URLs must preserve `utm_*`, `gclid`, and booking params.
- Existing assets:
  - URL pack and rendering matrix already prepared in strategy docs.
  - Probe artifacts and OpenAPI snapshot available for technical verification.
- Compliance constraints:
  - Consent Mode v2 default-deny remains active.
- Measurement hooks:
  - Pre-handoff diagnostics are available; completion bridge is missing.

### Redirect Map Input Sources
- Search Console not-found/exported crawl errors.
- Server/application logs for booking-like 404 routes.
- Paid media destination URL list and landing-page mapping.
- Historical known aliases from legacy content.

### Redirect Priority V1 (Derived 2026-02-17)
Source basis:
- Search Console page-level snapshot: `.tmp/search-console-hostel-pages-2025-11-01_2026-02-17.json` (`79` rows; `35` booking-like rows).
- GA4 `See untagged pages` list provided by owner (large cluster of malformed cross-locale and legacy paths).
- Live HTTP checks on top Search Console candidates.
- Candidate build artifact using D5 policy:
  - `.tmp/redirect-v1-candidates-2026-02-17.csv`
  - `.tmp/redirect-v1-candidates-2026-02-17.json`

| Priority | URL pattern / cluster | Evidence | Proposed target behavior | Implementation note |
|---|---|---|---|---|
| P0 | `/en/assistance` and `/en/assistance/*` legacy cluster | `257` impressions in Search Console booking-like rows; most child paths return `404`; base path serves `200` with canonical pointing to `/en/help/` | Canonicalize old English help namespace to `/en/help/` (index and selected legacy children) | Add explicit 308 map for known high-impression legacy slugs; fallback unmatched legacy children to `/en/help/` |
| P0 | `/de/hilfezentrum/*` legacy cluster | `26` impressions; sampled URLs return `404` | Redirect to `/de/hilfe/` equivalents; unknown children to `/de/hilfe/` | Add namespace-level legacy alias + targeted slug mappings where equivalents exist |
| P0 | `www.hostel-positano.com/ru/pomosh/*` and `hostel-positano.com/ru/pomosh/*` | `23` impressions; sampled URLs return `404`; wrong root slug (`pomosh` vs canonical `pomoshch`) | Redirect to canonical host + canonical RU help root (`/ru/pomoshch/`) | Add host normalization + RU help-root legacy alias map |
| P1 | `/ja/shien/*` and `/ja/assistance/*` | `9` impressions; sampled URLs return `404`; canonical JA help root is `/ja/sapoto/` | Redirect to `/ja/sapoto/` equivalents where possible; otherwise `/ja/sapoto/` | Add JA legacy root aliases (`shien`, `assistance`) |
| P1 | `/{lang}/home.html` (`it`, `pt`, `zh` observed) | `5` impressions; sampled URLs return `404` | Redirect to locale home root (`/{lang}/`) | Single explicit rule family; preserve query params |
| P1 | Cross-locale section mismatch (for example `/ja/zimmer`) | Seen in Search Console and GA4 untagged list; sampled `/ja/zimmer` returns `404` | Redirect to locale-correct section slug (`/ja/heya`) | Use locale-aware section slug map from `apps/brikette/src/slug-map.ts` |
| P2 | Existing localized room aliases already resolving via multi-hop (`/de/zimmer/`, `/it/camere/`, etc.) | `100` impressions combined; first response often `308`, final canonical localized URL resolves | Keep behavior but remove unnecessary hop chains where feasible | Optional optimization after P0/P1 to reduce crawl churn |
| P2 | Preview-domain URLs in diagnostics (`*.brikette-website.pages.dev`) | Present in GA4 untagged diagnostics | Exclude from production redirect KPI accounting; manage by domain policy in analytics | Does not block production redirect map; track separately |

### Search Console Manual Not-Found Sample (2026-02-17)
Source basis:
- Owner-provided Search Console `Not found (404)` sample list with last-crawled timestamps (12-14 Feb 2026).
- Live HTTP checks on all 10 sample URLs (all return `404`).
- Redirect recommendation artifact:
  - `.tmp/search-console-not-found-sample-2026-02-17.csv`

Key finding:
- These sampled URLs are dominated by cross-locale help-root and legacy article-slug combinations.
- For this phase, the safest long-term redirect policy is:
  - canonical host normalization (`www` -> apex),
  - then locale help-index fallback (`/{lang}/{assistanceSlug}`),
  - and only later add article-level redirects once target article URLs are verified `200` in production.

| Source URL (sample) | Last crawled | Recommended Phase-1 308 target | Target status | Note |
|---|---|---|---|---|
| `https://hostel-positano.com/it/aide/difetti-danni` | 2026-02-14 | `https://hostel-positano.com/it/assistenza` | `200` | FR help root + legacy article alias under IT locale |
| `https://hostel-positano.com/ja/pomosh/juridico` | 2026-02-14 | `https://hostel-positano.com/ja/sapoto` | `200` | RU/PT slug mix under JA locale |
| `https://hostel-positano.com/de/aide/buchungen-reservierungen` | 2026-02-14 | `https://hostel-positano.com/de/hilfe` | `200` | FR help root + legacy article alias under DE locale |
| `https://hostel-positano.com/fr/ajuda/legal` | 2026-02-13 | `https://hostel-positano.com/fr/aide` | `200` | PT help root under FR locale |
| `https://hostel-positano.com/it/pomosh/juridico` | 2026-02-13 | `https://hostel-positano.com/it/assistenza` | `200` | RU/PT slug mix under IT locale |
| `https://hostel-positano.com/es/ajuda/legal` | 2026-02-13 | `https://hostel-positano.com/es/ayuda` | `200` | PT help root under ES locale |
| `https://www.hostel-positano.com/fr/pomosh/securite` | 2026-02-13 | `https://hostel-positano.com/fr/aide` | `200` | `www` + RU help root under FR locale |
| `https://hostel-positano.com/it/aide/checkin-checkout` | 2026-02-13 | `https://hostel-positano.com/it/assistenza` | `200` | FR help root + EN article alias under IT locale |
| `https://hostel-positano.com/de/da` | 2026-02-12 | `https://hostel-positano.com/de/` | `200` | Ambiguous short path; safest DE home fallback |
| `https://hostel-positano.com/it/hilfezentrum/checkin-checkout` | 2026-02-12 | `https://hostel-positano.com/it/assistenza` | `200` | Legacy DE help-root alias under IT locale |

## Hypothesis & Validation Landscape
### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Brikette-first SSR discovery increases handoff rate | SSR booking quality, CTA continuity | Medium | 2-3 weeks |
| H2 | Canonical redirect coverage reduces invalid booking-route traffic near zero | Redirect map completeness, query preservation | Low | 3-7 days |
| H3 | Handoff mode/endpoint normalization improves attribution diagnosability | GA4 taxonomy rollout | Low | 1-2 weeks |
| H4 | Even without read-side API checks, route hardening + handoff simplification can increase qualified handoff rate | SSR quality, CTA continuity, endpoint/mode policy | Medium | 2-4 weeks |
| H5 | Export/import reconciliation can provide usable post-handoff outcome visibility for weekly optimization | export cadence, field completeness, reconciliation method | Medium | 2-4 weeks |

### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence |
|---|---|---|---|
| H1 | Rendering/fallback weaknesses observed | `docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md` | Medium |
| H2 | `/book` orphan and near-miss risk observed | `docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md` | High |
| H3 | Pre-handoff event coverage and completion gaps documented | `docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md` | Medium |
| H4 | Flow statefulness and deep-link fragility documented; supports simplified handoff strategy | `docs/business-os/strategy/BRIK/2026-02-17-octorate-process-reduction-feasibility.user.md` | Medium |
| H5 | Completion closure gap and export availability documented | `docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md` | Medium |

### Availability Policy (No-API Mode)
- No read-side availability API checks in product flow for this scope.
- User flow policy: always allow handoff to Octorate checkout; Octorate remains source of truth for real-time availability.
- Telemetry requirement:
  - keep pre-handoff intent/selection/handoff events complete,
  - optionally track `availability_check_status=skipped_no_api` for explicit reporting segmentation.
- Future upgrade condition:
  - re-open read-side availability checks only if Octorate API access is granted.

### Completion Join Strategy (Minimum Viable Options)
| Option | Join key | Effort | Fidelity | Risks | Recommended use |
|---|---|---|---|---|---|
| A | Aggregate closure only (daily handoff counts vs Octorate booking exports) | Low | Medium (aggregate only) | no user-level attribution | Baseline in no-API mode |
| B | Probabilistic join (`utm_*`, dates, pax, stay window, booking timestamp windows) | Medium | Medium-Low | join ambiguity and false matches | Recommended no-API optimization mode |
| C | Deterministic click-id/webhook join | High | High | unavailable without API/webhook access | Deferred until access changes |

- Minimum success criteria proposal:
  - Aggregate reconciliation coverage >= 95% of exported bookings by day/channel window.
  - Probabilistic match coverage >= 60% with documented confidence caveats.

## Decision Outcomes (Evidence-Backed Defaults)
Decision owner: Pete
Decision status date: February 17, 2026

### D1 outcome: `result` default, constrained `confirm` when deterministic
- Selected option: D1-O2.
- Why this is best long-term:
  - preserves robustness against JSF/session fragility while keeping a path to lower-friction handoff when room/rate is known.
  - matches current implementation pattern in `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx:80` and `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx:96`.
- Guardrails:
  - `confirm` allowed only when room/rate context is explicitly present and validated.
  - no deep-linking beyond `result.xhtml`/`confirm.xhtml`.

### D2 outcome: normalize to `same_tab`
- Selected option: D2-O1.
- Why this is best long-term:
  - eliminates mixed-mode attribution ambiguity and aligns user flow semantics across entry points.
  - current mixed mode is implementation drift (`packages/ui/src/organisms/modals/BookingModal.tsx:242` uses `target="_blank"` while apartment/booking2 use same-tab via navigation in `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx:84` and `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx:91`).
- Guardrails:
  - make `handoff_mode` mandatory in telemetry until normalization is complete.

### D3 outcome: no-API availability in Phase 1
- Selected option: D3-O1.
- Why this is best long-term (under current access constraints):
  - avoids blocking funnel hardening on unavailable API/webhook onboarding.
  - Octorate remains source of truth for real-time availability at checkout.
- Policy:
  - no hard pre-handoff availability gate.
  - always allow handoff; record no-API posture in reporting (`availability_check_status=skipped_no_api` optional).

### D4 outcome: aggregate + probabilistic closure in no-API mode
- Selected option: D4-O2.
- Why this is best long-term (until access changes):
  - gives materially better optimization signal than aggregate-only while staying feasible with current exports.
  - supported by existing reservation export + processing tooling (`packages/mcp-server/octorate-export-final-working.mjs`, `packages/mcp-server/octorate-process-bookings.mjs`, `packages/mcp-server/octorate-full-pipeline.mjs`).
- Operating model:
  - baseline: aggregate reconciliation (handoff totals vs export totals).
  - directional layer: probabilistic matching on date window + stay window + pax + channel signal.
- future upgrade: deterministic click-id join if/when API/webhook onboarding becomes available.

### D5 outcome: redirect cutoff policy (free-tier compatible)
- Selected option: D5-O2 (intent allowlist + thresholded inclusion; explicit scan-noise exclusion).
- Why this is best long-term:
  - focuses redirect effort on business-intent legacy routes with measurable value.
  - avoids polluting redirect rules with attack/scanner noise that dominates Cloudflare 404 logs.
  - fits Cloudflare free-tier data constraints (short lookback, day-by-day rollup).
- Policy:
  - Include in mandatory redirect map when URL is in booking/help/commercial-intent namespaces and meets one of:
    - Search Console impressions >= 5 in analysis window, or
    - appears in known campaign destination inventory, or
    - appears in 7-day Cloudflare 404 rollup with meaningful repeat count and semantic match to known locale/section aliases.
  - Exclude from redirect map:
    - scanner/attack signatures (`.env`, `.php`, `.txt`, `wp-*`, `docker/*`, similar probe paths),
    - nonsensical locale/path combinations with no business-intent match.
  - Keep excluded paths as 404 (or WAF/security rules), not redirects.

### D6 outcome: Cloudflare auth posture for unattended runs
- Selected option: D6-O1 (dedicated scoped API token as primary; Wrangler OAuth fallback for local operator debugging only).
- Why this is best long-term:
  - stable for automation and team handover.
  - least privilege and auditable rotation.
  - no paid Cloudflare tier required.
- Required token capabilities:
  - zone visibility (`Zone:Read`) and analytics query scope used by current scripts.
- Operating policy:
  - production/automation scripts use dedicated token from secret manager.
  - Wrangler OAuth remains a manual break-glass path for local troubleshooting.

## URL Canonicalization Acceptance Criteria
- `308 /book -> /en/book` with exact query preservation.
- `308 /book?utm_source=x&gclid=y -> /en/book?utm_source=x&gclid=y` with no loss/reordering side effects that break parsing.
- Booking params (`checkin`, `checkout`, `pax`, `codice`) remain intact.
- No double-encoding introduced by redirect layer.
- Trailing slash and known aliases map to canonical localized booking routes.

## GA4 Taxonomy & Reporting Requirements
### Canonical Events
- `handoff_to_engine` is canonical handoff event.
- `begin_checkout` retained only as migration compatibility event.

### Required Admin/Reporting Deliverables
- Conversion mapping document:
  - which events are marked conversions,
  - rationale for each,
  - owner and review cadence.
- Reporting surfaces:
  - funnel dashboard definition for intent -> exposure -> selection -> handoff -> completion (when available).
- Admin checks:
  - referral exclusion/cross-domain assessment,
  - internal traffic filtering,
  - consent-segmented reporting stance.

### Consent Reporting Rule
- Funnel decisions must be reported in two cuts:
  - consented-only deterministic view,
  - blended modeled view.
- Reports must declare which view is used for each decision.

## Test Landscape
### Minimum Required Test Suite (Phase 1)
- Redirect contract tests:
  - table-driven cases for canonical and near-miss booking routes with query preservation.
- SSR/no-JS smoke tests for commercial routes:
  - `/{lang}`, `/{lang}/book`, `/{lang}/rooms`, `/{lang}/apartment/book`, `/{lang}/deals`.
- Event contract tests:
  - `handoff_to_engine` must include `handoff_mode`, `engine_endpoint`, `checkin`, `checkout`, `pax`.
- E2E critical path:
  - selection -> handoff to chosen endpoint works.
- Completion-bridge test seam:
  - join key presence and reconciliation correctness on sample payloads.

### Monitoring/Alert Triggers
- Spike in `page_not_found` on booking-like paths.
- Material drop in `handoff_to_engine` rate after route changes.
- Missed or delayed Octorate export ingestion beyond agreed cadence.
- Reconciliation/match coverage below minimum threshold once export-based closure is active.

## Questions
### Resolved
- Q: Can Octorate pre-checkout UX be reduced without replacing transactional checkout?
  - A: Yes; move discovery/selection first-party and keep Octorate final checkout.
  - Evidence: `docs/business-os/strategy/BRIK/2026-02-17-octorate-process-reduction-feasibility.user.md`.
- Q: Is deep-linking into Octorate mid-flow reliable enough for core integration?
  - A: No; JSF state/session behavior is brittle.
  - Evidence: `docs/business-os/strategy/BRIK/2026-02-17-octorate-process-reduction-feasibility.user.md`.
- Q: Can GA4 currently close booking/revenue loop end-to-end?
  - A: No; current coverage is pre-handoff only.
  - Evidence: `docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md`, `docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md`.
- Q: Are Octorate read-side API and webhook onboarding confirmed ready for BRIK production use?
  - A: No. API/webhook access is unavailable for this phase.
  - Evidence: owner confirmation plus local verification (no API credential vars; no active session artifacts in this environment).
- Q: Which GA4 conversion/key events are currently configured in Admin?
  - A: `purchase`, `begin_checkout`, `click_whatsapp`, `click_check_availability` are configured as both key events and conversion events.
  - Evidence: GA4 Admin API query on 2026-02-17 (property `properties/474488225`, stream `properties/474488225/dataStreams/10183287178`).
- Q: Are referral exclusions and cross-domain linking domains configured as intended in GA4 Admin UI?
  - A: Not yet. Unwanted referrals are empty, and cross-domain include domains are not configured (suggestions pending for `hostel-positano.com` and `brikette-website.pages.dev`).
  - Evidence: GA4 Admin screenshots from 2026-02-17 tag settings (`List unwanted referrals`, `Configure your domains`) and diagnostics panel (`Needs attention`).
- Q: Which URLs are currently listed in GA4 `See untagged pages` diagnostics?
  - A: Received. The list is dominated by preview-domain entries plus non-canonical/legacy multilingual paths (many malformed or likely stale), not only core canonical commercial URLs.
  - Evidence: owner-provided `See untagged pages` export/list on 2026-02-17.
- Q: Is Search Console data now programmatically accessible for this property?
  - A: Yes, for page-level performance data. The service account can now access `sc-domain:hostel-positano.com` and return page rows.
  - Evidence: Search Console API `sites.list` and `searchanalytics.query` run on 2026-02-17; snapshot stored at `.tmp/search-console-hostel-pages-2025-11-01_2026-02-17.json`.
- Q: Is there evidence of active paid-medium campaign traffic in the GA4 property for the sampled period?
  - A: No. Paid-like mediums (`cpc`, `ppc`, `paid`) were not returned in GA4 Data API reports from `2024-01-01` to `2026-02-17`.
  - Evidence: GA4 Data API medium breakdown run on 2026-02-17.
- Q: Is `handoff_to_engine` now configured in GA4 even though the site does not emit it directly yet?
  - A: Yes. Stream-level event create rules now map both `begin_checkout` and `search_availability` into `handoff_to_engine`.
  - Evidence: GA4 Admin API create/list on 2026-02-17 (`eventCreateRules/13623175772`, `eventCreateRules/13623239459`) plus key event creation (`keyEvents/13623321711`).
- Q: Are paid campaigns currently active for this property?
  - A: No.
  - Evidence: owner confirmation on 2026-02-17 plus GA4 medium breakdown with no paid-like mediums in sampled period.
- Q: Is Cloudflare analytics auth still blocked in this environment?
  - A: No. Zone/API queries and export script runs are now working.
  - Evidence: successful 2026-02-17 runs of zone lookup + `pnpm brik:export-cloudflare-proxies ... --dry-run`; top-404 sample artifact `.tmp/cloudflare-top-404-2026-02-16.json`.
- Q: Should `brikette-website.pages.dev` be included in cross-domain linking configuration for production analysis?
  - A: Yes (`include` decision provided by owner).
  - Evidence: owner decision in working session on 2026-02-17.
- Q: Do current reservation exports in production include stable cancellation/refund fields suitable for lifecycle closure?
  - A: Not in the current export profile. The sampled reservations export has no explicit cancellation/refund/status columns.
  - Evidence: header inspection of `packages/mcp-server/.tmp/octorate-downloads/2026-02-14T21-11-05_1771103464860.xlsx` on 2026-02-17.
- Q: What does the manually exported Search Console not-found sample imply for redirect design?
  - A: Immediate redirect value is in host + locale-help-root normalization, not article-level mapping. For the sampled 404s, help-index redirects are the reliable Phase-1 target set.
  - Evidence: owner-provided URL sample with crawl dates + live checks + `.tmp/search-console-not-found-sample-2026-02-17.csv`.

### Decision Questions (Answered)
A) Completion closure (answered)
1. Export cadence: daily preferred for decision cadence; weekly fallback acceptable only as temporary operating mode.
2. Matching approach: aggregate + probabilistic in no-API mode (selected).
3. Match coverage target: start at >=60% probabilistic coverage with explicit confidence caveats; raise target after first calibration cycle.

B) Availability check policy (answered)
4. No-API policy: always hand off to Octorate; no hard pre-handoff gate in this phase.

C) Handoff normalization (answered)
5. Normalize to same-tab.
6. Endpoint policy: `result` default; constrained `confirm` only when room/rate context is deterministic.

D) SSR/no-JS acceptance (answered)
7. i18n leakage policy: treat unresolved i18n keys in server HTML as release-blocking on commercial routes.
8. `/{lang}/book` target for this phase: SSR persuasion + reliable handoff shell (not full transactional SSR checkout mechanics).

E) Redirect scope (answered)
9. Redirect map sources of truth: Search Console + server logs + paid media destination list.
10. Alias rollout policy: include high-volume historical aliases in initial rollout; expand from observed 404/campaign leakage data.

### Open (Data Required; Not Fully Answerable From Current Artifacts)
1. What is the currently achievable probabilistic join precision (false-positive/false-negative rates) for BRIK traffic?
  - Calibration attempt status:
    - Octorate side is available and parsed for `2026-02-10` to `2026-02-17` (`31` deduped bookings).
    - GA4 handoff-intent events remain zero in same window (`begin_checkout=0`, `handoff_to_engine=0`).
  - Missing data:
    - one overlapping window with non-zero GA4 handoff events (`begin_checkout` and/or `handoff_to_engine`) and non-zero Octorate created bookings to support aggregate and probabilistic matching.
  - Current blocker:
    - measurement capture gap on GA4 handoff events, not export availability.
2. What is the root cause for GA4 `untagged pages` diagnostics on URLs where the GA tag appears in returned HTML (for example stale diagnostics window, crawler execution constraints, redirect/error-page classification)?
  - Missing data: GA4 diagnostics detail (detection timestamps/scope) plus one targeted validation pass in Tag Assistant for representative URLs by status class (`200`, `308`, `404`).
3. Can Search Console not-found dataset be exported programmatically in current environment?
  - Missing data: crawl-error/notFound URL feed via API is not exposed in the current runtime client surface.
  - Current workaround: manual Search Console UI export is confirmed viable (sample set captured on 2026-02-17) and should be used for redirect map refreshes until API coverage changes.
## Ownership Map (RACI-lite)
- Decision owner: Pete (business and phase policy approvals).
- Technical owner: Brikette engineering (routes, redirects, CTA flow, event schema).
- Analytics owner: GA4 taxonomy, conversion mapping, reporting definitions.
- Integration owner: Octorate export pipeline and import/reconciliation implementation.
- Ops/data steward: export operations, reconciliation checks, and booked-stay closure validation.

## Confidence Inputs
### Rubric
- Implementation: technical feasibility and bounded complexity are evidenced.
- Approach: phased strategy is coherent and defensible.
- Impact: expected business/measurement value is material and measurable.
- Delivery-Readiness: decisions, owners, acceptance criteria, and seams are clear.
- Testability: required behavior can be validated deterministically.

### Scores
- Implementation: 84%
  - Evidence basis: feasibility established; integration boundaries are explicit.
  - Raise to >=90: complete one live calibration run for reconciliation quality.
- Approach: 88%
  - Evidence basis: phased model matches confirmed no-API constraint and avoids blocked work.
  - Raise to >=90: finalize reconciliation and reporting conventions.
- Impact: 88%
  - Evidence basis: route health + SEO + attribution improvements are high leverage.
  - Raise to >=90: baseline-to-target KPI deltas agreed.
- Delivery-Readiness: 88%
  - Evidence basis: D1-D4 are now explicit defaults and acceptance/test seams are defined.
  - Raise to >=90: assign named owners and dates for calibration and GA4 admin checks.
- Testability: 86%
  - Evidence basis: pre-handoff and redirect contracts are testable; no-API reconciliation seam is defined.
  - Raise to >=90: implement automated export ingest + reconciliation QA checks.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `/{lang}/book` remains hydration-dependent and underperforms as landing page | Medium | High | SSR acceptance criteria plus no-JS smoke suite |
| Redirect map incompleteness drops campaign traffic | Medium | High | explicit input sources + contract tests + staged validation |
| Mixed handoff mode keeps attribution noisy | High | Medium | normalize to same-tab or track mode as mandatory dimension |
| Completion reconciliation not implemented, blocking post-handoff optimization | High | High | implement selected D4 aggregate+probabilistic model with explicit cadence/QA |
| Deep-linking into Octorate mid-flow regresses reliability | Medium | High | enforce DO/DON'T integration rules |
| No API/webhook access limits attribution fidelity | High | Medium | use aggregate + probabilistic reconciliation with explicit confidence caveats |
| Manual export dependency causes operational drift or missed data windows | Medium | Medium | define owner, cadence, and QA checklist for export/import runs |

## Planning Constraints & Notes
- Must-follow patterns:
  - Octorate remains transaction engine in initial phases.
  - No JSF state replay/deep-link automation strategy.
  - Multilingual canonical routes remain authoritative.
- Rollout/rollback expectations:
  - feature-flag endpoint/mode/event migration.
  - rollback to previous handoff behavior if conversion alarms trigger.
- Observability expectations:
  - stable pre-handoff schema before behavior changes.
  - export-based closure must publish match-coverage KPI and reconciliation lag.

## Suggested Task Seeds (Non-binding)
- TASK-01: Canonical booking URL and redirect map specification + contract tests.
- TASK-02: SSR/no-JS hardening for booking landing surfaces and i18n leakage gates.
- TASK-03: GA4 taxonomy migration to `handoff_to_engine` with required params.
- TASK-04: Handoff endpoint/mode normalization implementation.
- TASK-05: Octorate export ingest + aggregate/probabilistic reconciliation pipeline.
- TASK-06: Reporting layer updates to distinguish deterministic pre-handoff vs reconciled post-handoff metrics.

## Execution Routing Packet
- Primary execution skill:
  - `lp-build`
- Supporting skills:
  - `lp-design-spec`, `lp-seo`
- Deliverable acceptance package:
  - canonical redirect behavior passes contract suite,
  - booking route SSR/no-JS acceptance criteria pass,
  - handoff event schema and dedupe contract are stable,
  - no-API post-handoff reconciliation mechanism selected and instrumented.
- Post-delivery measurement plan:
  - KPI 1: SSR booking-page sessions -> `handoff_to_engine` rate.
  - KPI 2: offer exposure -> selection rate.
  - KPI 3: booking-like 404 traffic trend to near zero.
  - KPI 4: export reconciliation coverage/match rate and reconciliation lag.

## Evidence Gap Review
### Gaps Addressed
- Consolidated external brief + feasibility + GA4 setup into one planning artifact.
- Added decision-forcing agenda with defaults, consequences, and fallbacks.
- Added no-API completion reconciliation options and minimum success thresholds.
- Added explicit availability policy, URL acceptance criteria, and ownership map.

### Confidence Adjustments
- Raised delivery-readiness and testability due to explicit D1-D4 outcomes and resolved A-E defaults.
- Kept explicit data-gap list for optimization fidelity work that cannot be answered from current artifacts.

### Remaining Assumptions
- Octorate exports contain sufficient fields for aggregate and probabilistic reconciliation.
- GA4 admin-side configuration changes are available in the same delivery window.
- Required source data for redirect map can be assembled quickly.

## Pending Audit Work
- Areas examined:
  - strategy docs and probe artifacts listed in `Relates-to`.
  - key booking/analytics file entry points for scope anchoring.
- Areas remaining:
  - targeted git-history analysis for booking/analytics modules.
  - current automated test inventory against the minimum suite defined above.
  - Octorate export field validation for chosen reconciliation method.
- Resumption entry points:
  - `docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md`
  - `docs/business-os/strategy/BRIK/2026-02-17-octorate-process-reduction-feasibility.user.md`
  - `.tmp/octorate-funnel-probe-2026-02-17/report.json`
- Remaining scope estimate:
  - one decision session plus one technical spike cycle.

## Planning Readiness
- Status: Ready-for-planning
- Remaining prerequisites (non-blocking for plan start):
  - confirm owners for integration and analytics admin tasks.
  - run a second reconciliation on an overlapping non-zero window (GA4 handoff events + Octorate created bookings); this does not require a future-only date range.
  - review and approve redirect candidate artifact generated from D5 policy:
    - `.tmp/redirect-v1-candidates-2026-02-17.csv`
    - `.tmp/redirect-v1-candidates-2026-02-17.json`
  - merge approved manual Search Console 404 sample mappings into redirect implementation backlog:
    - `.tmp/search-console-not-found-sample-2026-02-17.csv`
  - map remaining approved candidates to canonical locale targets and exclude malformed probe variants (for example URL-encoded suffix artifacts like `%3E`).
  - paid-destination mapping is currently N/A (no active paid campaigns); re-open only if campaigns restart.
  - apply decided preview-domain cross-domain policy (`brikette-website.pages.dev` included) in GA4 tag settings.
  - unblock GA4 handoff capture (currently zero in Data API window `2026-02-10` to `2026-02-17`) and re-run calibration:
    - `.tmp/reconciliation-2026-02-10_2026-02-17/calibration-summary.md`
  - run one GA4 diagnostics root-cause check on representative `200`/`308`/`404` URLs from the untagged list.
- Recommended next step:
  - proceed to `/lp-plan` with D1-D4 defaults locked and explicit data-gap tasks in the plan.
