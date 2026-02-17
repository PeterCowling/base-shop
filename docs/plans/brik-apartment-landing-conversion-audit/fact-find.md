---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: brik-apartment-landing-conversion-audit
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: website-upgrade-backlog
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-plan, lp-seo, lp-design-spec
Related-Plan: docs/plans/brik-apartment-landing-conversion-audit/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Brik Apartment Landing Conversion Audit - Fact-Find Brief

## Scope
### Summary
Convert the current `/en/apartment` and `/en/apartment/book` audit into a planning-ready website-upgrade backlog focused on conversion, trust transfer, and SEO discoverability. The observed state indicates message mismatch, booking-path mismatch, and rendering/indexability risk.

### Goals
- Separate observed behavior from assumptions that require verification.
- Create an implementation-ready, prioritized gap backlog for apartment landing conversion.
- Define a proof-first content and media structure for the apartment page.
- Define technical SEO, structured data, and multilingual/canonical hardening requirements.
- Provide a 14-day execution sequence with measurable conversion events.

### Non-goals
- Shipping code/content changes in this fact-find.
- Approving unverified apartment specifications as final truth.
- Rewriting hostel-wide IA outside apartment and immediate cross-link surfaces.

### Constraints & Assumptions
- Constraints:
- Evidence in this run is primarily a supplied page observation snapshot (server-rendered HTML + assets), not a full repository/runtime trace.
- Claims about live runtime JS behavior, CMS truth, and booking-engine mappings are treated as assumptions until verified.
- Assumptions:
- Client-side JS may hydrate missing copy in a normal browser session.
- Apartment specifications in draft copy examples (for example size and bed/bath configuration) are likely correct but must be verified against source-of-truth listing/CMS.

## Evidence Audit (Current State)
### Entry Points
- Route under audit: `/en/apartment`
- Booking route under audit: `/en/apartment/book`
- Current global header booking route observed from apartment page: `/en/book`
- Canonical platform capability pointer: `docs/business-os/platform-capability/latest.user.md`
- Canonical BRIK upgrade brief pointer: `docs/business-os/site-upgrades/BRIK/latest.user.md`

### Key Modules / Files
- Evidence capture artifacts (required before `/lp-build` execution):
- `artifacts/fact-find/2026-02-17/apartment.en.view-source.html` - raw source capture for `/en/apartment`.
- `artifacts/fact-find/2026-02-17/apartment.book.en.view-source.html` - raw source capture for `/en/apartment/book`.
- `artifacts/fact-find/2026-02-17/apartment.en.screenshot.png` - rendered-page screenshot (JS on).
- `artifacts/fact-find/2026-02-17/apartment.book.en.screenshot.png` - booking-page screenshot (JS on).
- `artifacts/fact-find/2026-02-17/evidence-notes.md` - capture timestamp, URL, user-agent, JS mode, and assertion results.
- Not yet inspected in this run: apartment page source modules, localization loading path, booking-widget implementation modules, and terms-link source of truth.

### Evidence Appendix (Reproducible Capture Contract)
| Artifact | URL | Capture mode | Required metadata | Validation check |
|---|---|---|---|---|
| `apartment.en.view-source.html` | `/en/apartment` | JS-off source capture | UTC timestamp, user-agent string | `heroTitle|body|amenitiesHeading|fitCheck\\.` do not appear |
| `apartment.book.en.view-source.html` | `/en/apartment/book` | JS-off source capture | UTC timestamp, user-agent string | `book\\.heroTitle|book\\.dateLabel|book\\.` keys do not appear |
| `apartment.en.screenshot.png` | `/en/apartment` | JS-on visual capture | viewport size, locale | Header CTA label and destination are apartment-specific |
| `apartment.book.en.screenshot.png` | `/en/apartment/book` | JS-on visual capture | viewport size, locale | Terms link label is booking-context accurate |

Pass/fail checks to store in `artifacts/fact-find/2026-02-17/evidence-notes.md`:
- `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "<URL>" | grep -E "heroTitle|amenitiesHeading|fitCheck\\.|book\\.heroTitle|book\\.dateLabel"` returns zero matches.
- Source HTML contains one human-readable `h1` for each page.
- Header apartment CTA target resolves to `/en/apartment/book` for apartment routes.

### Patterns & Conventions Observed
- i18n keys appear in rendered HTML where human-readable copy is expected (for example `heroTitle`, `body`, `amenitiesHeading`).
  - Evidence: supplied `/en/apartment` rendered HTML observations.
- Primary high-intent header CTA on apartment page routes to hostel booking flow.
  - Evidence: supplied route observation showing `/en/book` target.
- Media currently communicates destination mood and hostel context more than apartment product proof.
  - Evidence: supplied asset examples (cocktails, buses, hostel communal terrace).
- Price anchoring and reviews are absent from extracted page content.
  - Evidence: supplied content extraction notes.
- Booking route appears to have similar placeholder/i18n leakage risk.
  - Evidence: supplied `/en/apartment/book` observations (`book.heroTitle`, label placeholders).

### Data & Contracts
- Conversion job-to-be-done contract (commercial): convert apartment-intent visitor to booking-flow start in under 30 seconds.
- Product proof contract (differentiator): step-free/street-level arrival claim must be backed by route instructions + visual evidence.
- Trust contract: explicit relationship between apartment and Hostel Brikette must be unambiguous.
- Fallback contract: unavailable inventory should route to alternates, comparison path, or lead capture.

### Dependency & Impact Map
- Upstream dependencies:
- Translation/rendering pipeline for apartment pages.
- Header CTA routing logic scoped by page context.
- Booking engine integration for apartment inventory and pricing anchors.
- Content/media pipeline (image assets, alt text, captions).
- Downstream dependents:
- Organic discoverability (crawlable text, image SEO, structured data, hreflang/canonical signals).
- Conversion funnel metrics (CTA click-through, booking starts, WhatsApp assisted conversions).
- Brand clarity and trust (hostel vs apartment framing).
- Likely blast radius:
- Apartment page templates and booking flow surfaces.
- Header CTA behavior for apartment context.
- Cross-links from rooms, help/travel, and experiences surfaces.

### Delivery & Channel Landscape
- Audience/recipient:
- Search and direct visitors with "private apartment in Positano" intent.
- High-intent users requiring rapid booking certainty, step-free arrival proof, and policy clarity.
- Channel constraints:
- Page must convert on mobile within first screen.
- CTA stack must support direct booking plus assisted conversion via WhatsApp.
- Existing templates/assets:
- Existing page has placeholders and non-product-proof imagery.
- Existing travel/logistics content and hostel trust signals can be reused with explicit labeling.
- Approvals/owners:
- Product truth owner required for apartment facts sheet (capacity/layout/inclusions/policies).
- Marketing/ops owner required for image pack, review usage rights, and policy copy.
- Compliance constraints:
- Review excerpts must be attributable and permitted.
- Policy sections must reflect current legal/operational terms.
- Measurement hooks:
- Event set proposed: `apartment_view`, `cta_check_availability_click`, `booking_widget_interaction`, `start_booking`, `booking_complete`, `availability_no_result`, `fallback_click`, `whatsapp_click`, `gallery_open`, `faq_expand`, `directions_click`.

### Website Upgrade Inputs
- Existing site baseline:
- Apartment landing and booking pages show rendering and relevance gaps that impair conversion and crawl quality.
- Platform capability baseline:
- `docs/business-os/platform-capability/latest.user.md` (present; content not re-audited in this run).
- Business upgrade brief:
- `docs/business-os/site-upgrades/BRIK/latest.user.md` (present; content not re-audited in this run).
- Reference sites:
- Competitor-style "Details" block benchmark provided (Palazzo Margherita example) as directional pattern input.

### Canonical & hreflang Rules
- Canonical is self-referential for each locale URL.
- `hreflang` cluster includes all supported locales plus `x-default`.
- `hreflang` target points to same-language canonical URL (or closest substitute where exact locale is absent).
- Non-canonical host (`www` or non-`www`) is permanently redirected via 301.
- XML sitemap includes canonical locale URLs only.

### Best-Of Synthesis Matrix
| Pattern | Source reference | User value | Commercial impact | Platform fit | Effort | Risk | Classification | Rationale |
|---|---|---:|---:|---:|---:|---:|---|---|
| Above-the-fold booking module with dates + guests + immediate availability path | Supplied wireframe section C | High | High | High | Medium | Medium | Adopt | Reduces clicks-to-intent and exposes conversion path instantly. |
| Step-free proof module with route, map, and path photos | Supplied gap table + structure sections B/C | High | High | High | Medium | Medium | Adopt | Converts a rare differentiator from claim into verifiable proof. |
| Scannable quick-facts block (size, layout, inclusions) | Supplied copy/SEO sections D/E | High | High | High | Low | Low | Adopt | Reduces uncertainty and improves fit decision speed. |
| FAQ + policy accordion with explicit booking frictions addressed | Supplied FAQ list and policy requirements | High | Medium | High | Low | Low | Adopt | Addresses objections that otherwise leak to OTA channels. |
| Comparison/fallback paths to hostel private rooms + lead capture | Supplied fallback requirements | Medium | Medium | High | Low | Low | Adapt | Must preserve apartment-first framing while leveraging existing inventory. |
| Structured data stack (VacationRental + FAQ + Breadcrumb + rating guardrails) | Supplied SEO pack section E | Medium | Medium | High | Medium | Medium | Adopt | Improves machine readability; rich-result treatment depends on Google program and policy eligibility. |
| Full apartment-specific gallery taxonomy (terrace/living/bed/bath/kitchen/arrival) | Supplied image replacement plan section F | High | High | High | Medium | Low | Adopt | Visual proof directly addresses uncertainty and trust gaps. |

### Prioritized Website Upgrade Backlog Candidates
| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | Fix apartment-context header CTA routing to apartment booking | Current top CTA sends high-intent traffic to wrong product | On apartment templates CTA target is `/en/apartment/book`; label is apartment-specific; CTA click event includes `placement=header` | Header/nav template logic | Supplied observed route mismatch |
| P1 | Resolve SSR/static i18n rendering leakage on apartment and booking pages | Placeholder keys in source damage trust and indexing | `curl` JS-off checks for both routes return zero i18n key matches; source contains human-readable `h1`; evidence artifacts saved under `artifacts/fact-find/2026-02-17/` | i18n loading path, SSR/SSG config | Supplied placeholder-key evidence |
| P1 | Correct legal terms labeling/coverage for apartment flows | Apartment pages currently surface room-booking-specific terms wording, risking trust/compliance mismatch | Apartment routes show accurate terms label (`Terms and Conditions` or apartment-specific equivalent); linked policy explicitly covers apartment booking conditions in each locale | Legal/policy owner sign-off | Supplied apartment terms-label observation |
| P1 | Decide and enforce direct-booking perks behavior on apartment routes | Sitewide perks banner can conflict with OTA path expectations | Written decision signed (`perks_apply_apartment = yes/no`); if `yes`, perks shown and enforceable in apartment direct path; if `no`, perks banner suppressed for apartment routes | Revenue + marketing owner | Supplied banner/perks vs OTA contradiction |
| P1 | Add above-the-fold booking module with date/guest controls, pricing rule, and no-availability fallback | Booking intent currently lacks immediate self-qualification and fallback path | Above-fold module supports date+guest selection; unavailable searches show alternate dates or next-available plus links to `/en/rooms` and lead capture; events `availability_no_result` and `fallback_click` fire | Booking engine integration and rate source | Supplied no-price/no-widget observations |
| P1 | Replace hero/gallery with apartment-proof image set | Current media mismatches product intent | Hero and gallery show apartment interior/terrace/arrival proof; irrelevant assets removed from apartment gallery; all image alts are descriptive | New image assets and alt/caption data | Supplied asset mismatch list |
| P1 | Add quick facts + layout + inclusions + policy summary sections | Missing facts create uncertainty and bounce risk | Verified facts sheet fields published in scannable modules; capacity, layout, inclusions, and policy summaries are explicit | Product truth approvals | Supplied missing-offer-clarity gaps |
| P2 | Build step-free arrival proof section with route artifacts | Differentiator is high-value but currently unproven | Section includes annotated map, 3-step route, path/entrance photo proof, and baggage-help CTA | Ops photo/map artifacts | Supplied differentiator gap |
| P2 | Add trust and brand-framing block (apartment vs hostel) | Current framing risks product confusion | On-page copy clarifies apartment privacy and which hostel services are included/optional | Brand/legal approval | Supplied footer/framing gap |
| P2 | Publish on-page testimonial module (attributed) | Missing trust proof likely pushes users to OTAs | Apartment testimonial excerpts are visible with attribution and permissions log | Review rights and source data | Supplied missing reviews observation |
| P2 | Gate review schema eligibility separately from testimonial display | Marking up third-party aggregated ratings can create policy risk | `Review`/`AggregateRating` schema enabled only when first-party, on-page-visible review data exists; otherwise schema omitted | SEO + legal review | User-provided Google policy constraint |
| P2 | Apply technical SEO hardening (title/meta/H2 outline, image SEO, JSON-LD, canonical/hreflang rules) | Current content and multilingual duplication risk authority dilution | Metadata and schema valid; canonical/hreflang rule-set implemented; host redirect enforced; locale link targets use canonical route patterns (for example `/en/how-to-get-here`) | SEO implementation ownership | Supplied SEO pack and duplication-risk notes |
| P2 | Apartment landing performance hardening (mobile LCP/INP/CLS) | JS/render/media changes can regress conversion if performance is weak | Mobile budgets agreed and verified in CI/Lighthouse and post-launch monitoring; widget load does not create major CLS | Frontend performance ownership | User-provided conversion risk |
| P2 | Assisted conversion flow hardening (WhatsApp prefill + attribution) | WhatsApp clicks without context reduce ops efficiency and measurement value | WhatsApp CTA pre-fills dates/guests when selected; tracking includes route and context fields (`dates_selected`, `guests_selected`, `placement`) | Messaging template + analytics | User-provided assisted-conversion requirement |
| P3 | Add compare/fallback and lead capture flow | Captures users when apartment inventory is unavailable | Compare module and availability-updates capture are visible and tracked | CRM/list capture endpoint | Supplied fallback-path requirement |

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Correct apartment CTA destination materially increases booking-flow starts | CTA routing implementation + event tracking | Low | 1-3 days |
| H2 | SSR-resolved copy improves crawl quality and trust metrics | i18n SSR/SSG fix + indexability checks | Medium | 3-7 days |
| H3 | Apartment-specific hero/gallery increases engagement and CTA clicks | New asset set + gallery instrumentation | Medium | 3-7 days |
| H4 | Step-free proof module increases WhatsApp and booking intent among mobility-constrained users | Route proof assets + copy clarity | Medium | 7-14 days |
| H5 | Policy/FAQ clarity reduces assisted objections and drop-off | FAQ/policy modules + support tag taxonomy | Low | 7-14 days |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Current route mismatch observed; no event delta baseline supplied | Supplied page audit | Medium |
| H2 | Placeholder keys observed in extracted HTML | Supplied page audit | Medium |
| H3 | Irrelevant image set catalogued | Supplied page audit | Medium |
| H4 | Differentiator explicitly stated but not currently proven | Supplied page audit | Low |
| H5 | FAQ/policy omissions identified; no quantified objection logs attached | Supplied page audit | Low |

#### Falsifiability Assessment
- Easy to test:
- CTA reroute impact on `start_booking`.
- Booking widget interaction uplift after above-fold embed.
- Hard to test:
- Organic ranking movement attributable solely to SSR/content fixes in short window.
- Longitudinal trust effects from policy/review modules.
- Validation seams needed:
- Baseline snapshot before launch (events + funnel drop-offs).
- Post-launch segmented readout by device/language/source.

#### Recommended Validation Approach
- Quick probes:
- Ship CTA reroute + booking module + quick facts first, then observe booking-start rate and assisted-contact delta.
- Structured tests:
- Compare pre/post conversion metrics for apartment page cohorts over two 7-day windows.
- Deferred validation:
- Full multilingual SEO impact and rank-share trend after canonical/hreflang stabilization.

## External Research (If Needed)
- Finding: Competitor benchmark pattern (scannable apartment "Details" section with concrete specs) is provided as directional input; source URLs and extraction were not re-validated in this run.
- Finding: Review/ratings schema usage is gated by first-party, on-page-visible review data only; third-party aggregate sourcing is treated as ineligible for markup in this plan.
- Finding: Vacation-rental schema is planned for machine readability; rich-result appearance is treated as conditional on Google program/policy eligibility.

## Questions
### Resolved
- Q: What is the primary job of `/en/apartment`?
  - A: Convert apartment intent into booking-flow entry quickly, with proof and certainty.
  - Evidence: supplied page job statement section A.
- Q: Which conversion blockers are highest priority?
  - A: Wrong header CTA target, missing rendered copy, irrelevant hero/gallery assets, and missing booking/price anchoring.
  - Evidence: supplied prioritized gap table section B.

### Open (Converted to Verification Tasks)
| Task | Owner | Output artifact | Deadline | Default if overdue |
|---|---|---|---|---|
| Confirm apartment facts sheet (sqm, bed/bath, occupancy, inclusions, terrace type) | BRIK product/ops | `docs/plans/brik-apartment-landing-conversion-audit/apartment-facts-v1.md` | Day 1 | Publish only verified fields; suppress unknowns |
| Approve pricing claim policy (`book direct`, `from EUR X`) | Revenue/ops | `docs/plans/brik-apartment-landing-conversion-audit/pricing-claim-policy.md` | Day 1 | No numeric from-rate copy unless engine-backed |
| Confirm review excerpt permissions and source register | Marketing/ops | `docs/plans/brik-apartment-landing-conversion-audit/review-permissions-log.md` | Day 2 | Disable `Review`/`AggregateRating` schema |
| Confirm canonical host and locale matrix | Web platform owner | `docs/plans/brik-apartment-landing-conversion-audit/canonical-hreflang-rules.md` | Day 1 | Keep current host; do not rollout redirects |
| Confirm apartment legal terms scope/label in booking journey | Legal/ops | `docs/plans/brik-apartment-landing-conversion-audit/apartment-terms-scope.md` | Day 1 | Use neutral label and block apartment launch copy |
| Decide direct-booking perks behavior for apartment routes | Revenue + marketing | `docs/plans/brik-apartment-landing-conversion-audit/perks-decision.md` | Day 1 | Suppress perks banner on apartment routes |
| Validate locale-canonical internal links (`/en/how-to-get-here`, locale equivalents) | SEO owner | `docs/plans/brik-apartment-landing-conversion-audit/internal-link-map-v1.md` | Day 2 | Use locale-neutral fallback links only |

## Delivery Gates (Execution Readiness)
| Gate | Requirement | Status | Owner | Evidence artifact |
|---|---|---|---|---|
| Gate A - Facts Truth | Apartment facts sheet signed and publishable | Pending | Product/Ops | `apartment-facts-v1.md` |
| Gate B - Booking Path | Apartment booking flow reachable; `start_booking` fires from apartment route | Pending | Product + Engineering | Event capture + QA notes |
| Gate C - Crawlable Copy | JS-off source contains real localized copy and no translation keys | Pending | Engineering + SEO | Source captures in `artifacts/fact-find/2026-02-17/` |
| Gate D - Legal Terms | Apartment terms label/scope accurate across landing and booking pages | Pending | Legal/Ops | `apartment-terms-scope.md` |
| Gate E - Perks Coherence | Direct-booking perks behavior decided and enforced on apartment routes | Pending | Revenue + Marketing | `perks-decision.md` |
| Gate F - Schema Eligibility | Review schema enabled only if first-party review requirements are met | Pending | SEO + Legal | `review-permissions-log.md` |
| Gate G - Perf Guardrail | Mobile LCP/INP/CLS targets met post-change | Pending | Engineering | Performance report |

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Rendering issue is hydration-only and not consistently reproducible | Medium | High | Reproduce in view-source and crawler simulation before implementing fix path. |
| Unverified property facts create overclaim risk | Medium | High | Gate publishable copy on signed facts sheet. |
| "Step-free" claim is interpreted differently by guests | Medium | High | Add explicit route details and threshold disclosures with photos. |
| Pricing anchor becomes inaccurate by season/rate-plan | High | Medium | Prefer engine-backed dynamic range or date-scoped qualifier text. |
| Apartment terms label/content mismatches booking reality | Medium | High | Add explicit terms-scope gate and legal sign-off before launch. |
| Direct-booking perks messaging conflicts with OTA routes | Medium | High | Decide perks policy per route and enforce via banner/rate-rule behavior. |
| Review usage rights are unclear | Medium | Medium | Defer excerpt publication until source attribution permission is confirmed. |
| Canonical/hreflang rollout introduces temporary indexing churn | Medium | Medium | Stage redirect/canonical rollout with validation checks and monitoring. |
| Apartment-vs-hostel framing remains ambiguous after copy update | Medium | High | Add explicit service boundary module and QA messaging consistency site-wide. |
| Booking widget integration introduces mobile UX regressions | Medium | Medium | Add mobile QA gate for LCP, sticky CTA, and widget interaction completion. |

## Planning Constraints & Notes
- Must-follow patterns:
- Apartment-first framing with explicit hostel relationship context.
- Proof-before-claim for differentiators.
- Locale links must use current canonical route patterns (for example `/en/how-to-get-here`), not legacy host/path variants.
- Rollout/rollback expectations:
- Roll out in a P1-first sequence (routing/rendering/booking proof/media).
- Keep old CTA target and copy variants available for fast rollback if funnel errors spike.
- Observability expectations:
- Launch with required event instrumentation and 7-day monitoring cadence.

## Suggested Task Seeds (Non-binding)
- Capture reproducible evidence artifacts (JS-off source + JS-on screenshots + assertion log).
- Verify and publish apartment facts sheet.
- Confirm legal terms scope/label and direct-booking perks decision for apartment routes.
- Fix CTA routing and SSR/i18n rendering for apartment pages with deterministic grep-based checks.
- Implement above-the-fold booking module, no-result fallback, and mobile sticky CTA.
- Replace hero/gallery with minimum viable apartment-proof image set.
- Add quick facts, arrival proof, policies, FAQ, testimonial, and brand-framing modules.
- Apply SEO/schema/canonical/hreflang hardening with explicit rule-set.
- Add WhatsApp prefill/attribution instrumentation and performance guardrails (LCP/INP/CLS).
- Implement compare/fallback lead capture and canonical locale cross-links.

## Execution Routing Packet
- Primary execution skill:
- `lp-build`
- Supporting skills:
- `lp-plan`, `lp-seo`, `lp-design-spec`
- Deliverable acceptance package:
- Updated apartment and booking page behavior, validated routing, reproducible rendering evidence artifacts, legal/perks decision artifacts, new media/copy modules, SEO/schema/canonical artifacts, and event tracking verification.
- Post-delivery measurement plan:
- Track booking-start rate, CTA CTR by position, no-availability fallback usage, WhatsApp assist rate, FAQ expansion, mobile LCP/INP/CLS, and exit/drop-off deltas pre/post.

## Evidence Gap Review
### Gaps Addressed
- Converted unstructured audit notes into a canonical website-upgrade backlog with acceptance criteria and dependency mapping.
- Explicitly separated observed findings from assumptions requiring verification.
- Added hypothesis/falsifiability framework and measurable event schema for validation.

### Confidence Adjustments
- Replaced percentage-style confidence with gate-based readiness to remove execution ambiguity.
- Marked Gates A-G as pending until evidence artifacts and owner sign-offs are produced.

### Remaining Assumptions
- JS hydration behavior may mask SSR content issues in browser sessions.
- Apartment fact values in draft copy are assumed pending facts-sheet confirmation.
- Competitor benchmark references are directional and not re-verified in this run.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
- None for planning kickoff; unresolved assumptions should become early verification tasks in plan.
- Recommended next step:
- `/lp-plan`
