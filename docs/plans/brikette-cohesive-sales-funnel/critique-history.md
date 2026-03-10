# Critique History: brikette-cohesive-sales-funnel (fact-find)

## Round 1 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | `## Confidence Inputs / Impact` | Impact confidence 82% asserted with zero analytics baseline; structural observation only |
| 1-02 | Major | New section (missing) | Hypothesis & Validation Landscape absent — required for mixed execution track |
| 1-03 | Moderate | `## Risks` | "Content pages keep routing all intent" rated High likelihood without behavioral evidence |
| 1-04 | Moderate | Frontmatter `Supporting-Skills` + `## Execution Routing Packet` | `lp-seo` listed without any SEO rationale in document |
| 1-05 | Moderate | `## Confidence Inputs / Testability` | Testability 78% (below implicit threshold); two unmet prerequisites not flagged as planning gates |
| 1-06 | Minor | `## Suggested Task Seeds` | Seeds read as pre-committed plan tasks, not directions; may narrow planning prematurely |
| 1-07 | Minor | `## Data & Contracts / Locale boundary contract` | `calendar.xhtml` locale parameter gap noted but not cheaply verified |

### Issues Confirmed Resolved This Round
*(None — first round)*

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-06 | Minor | 1 | Suggested Task Seeds still read as implementation commitments — acceptable at planning stage but worth watching |
| 1-07 | Minor | 1 | `calendar.xhtml` locale parameter gap — cheaply testable; should be verified before plan locks locale boundary for private bookings |

### Autofix Summary (Round 1)
- F1 applied: Added `## Hypothesis & Validation Landscape` section (H1, H2, H3 + signal coverage + falsifiability + validation approach).
- F2 applied: Impact confidence basis rewritten to "structural observation only; no analytics baseline exists."
- F3 applied: Risk likelihood for content-CTA routing changed from High to Medium with escalation condition.
- F4 applied: `lp-seo` rationale added to Execution Routing Packet; `lp-design-spec` rationale added.
- F5 applied: Testability section now includes explicit planning prerequisite gate for two test cases.
- Score: 3.5 (partially credible). Recommended action: revise and re-critique before proceeding to plan.

## Round 2 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | `## Scope / Constraints & Assumptions`, `## Evidence Audit`, `## Confidence Inputs` | Same-domain secure-booking was treated as already available/live, but repo evidence only proves an env-gated code path behind `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED` |
| 2-02 | Major | New section (missing) | `## Test Landscape` absent for a mixed-track fact-find; this misses a required evidence-floor section before `Ready-for-planning` |
| 2-03 | Moderate | `## Planning Readiness` | "Blocking items: None" contradicted explicit plan-stage prerequisites for env verification, test sequencing, and analytics baseline sequencing |
| 2-04 | Moderate | `## Rehearsal Trace` / validation path | Forward trace omitted the env-gate precondition and analytics-baseline ordering dependency even though both materially affect implementation order |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | Impact confidence asserted without analytics baseline | Impact basis remains explicitly structural-only and validation now requires pre-ship GA4 baseline instrumentation |
| 1-02 | Major | Hypothesis & Validation Landscape absent | Section remains present with hypotheses, signal coverage, falsifiability, and validation approach |
| 1-03 | Moderate | Content-routing risk likelihood overstated | Risk remains downgraded to Medium with an evidence-based escalation condition |
| 1-04 | Moderate | `lp-seo` support lacked rationale | Execution Routing Packet now states the SEO rationale directly |
| 1-05 | Moderate | Testability prerequisite gates were not explicit | Testability and Planning Readiness now spell out plan-stage prerequisites for tests and instrumentation |
| 1-06 | Minor | Suggested Task Seeds read like pre-committed tasks | Seeds now include an explicit note that they are planning inputs only and may be reordered or discarded |
| 1-07 | Minor | `calendar.xhtml` locale gap was not cheaply verified | Locale boundary contract now explicitly states that both hostel and apartment builders omit locale params and cites the relevant source files |

### Issues Carried Open (not yet resolved)
*(None)*

### Autofix Summary (Round 2)
- F1 applied: Rewrote same-domain secure-booking references from "already live" to "env-gated code path," and added deployment-verification requirements.
- F2 applied: Added `## Test Landscape` with existing coverage, gaps, and recommended test approach.
- F3 applied: Aligned the hostel central path, checkout continuity contract, risk table, rehearsal trace, and planning readiness around env-gated handoff behavior and analytics ordering prerequisites.
- F4 applied: Clarified Suggested Task Seeds as non-binding planning inputs.
- Score: 3.0 (partially credible) before autofix. Post-autofix state is suitable for `/lp-do-plan` provided the first planning pass keeps deploy-env verification, test sequencing, and GA4 baseline instrumentation explicit.

## Round 3 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Critical | `## Constraints & Assumptions`, `## Rehearsal Trace`, `## Planning Readiness` | The fact-find still treated the hostel secure-booking shell as the canonical post-implementation path without elevating `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED=1` to a first-plan gate |
| 3-02 | Critical | `## Constraints & Assumptions`, `## Test Landscape`, `## Rehearsal Trace` | The doc assumed the secure-booking iframe step was operationally safe, but repo evidence only proves a Brikette shell around a cross-origin `result.xhtml` iframe/fallback with no staging proof of embeddability |
| 3-03 | Critical | `## Constraints & Assumptions`, `## Rehearsal Trace`, `## Execution Routing Packet` | The content-entry journey required hostel/private/hybrid routing, but the fact-find had no intent-resolution contract and no hybrid routing model; current `ContentStickyCta` still routes everything to hostel booking |
| 3-04 | Major | `## Patterns & Conventions Observed`, `## Rehearsal Trace`, `## Test Landscape` | Global CTA surfaces such as `NotificationBanner` remained outside the funnel policy even though they can divert content users into the hostel path without analytics parity |
| 3-05 | Major | `## Rehearsal Trace`, `## Risks`, `## Planning Readiness` | Room-assist recovery was underspecified: invalid secure-booking or iframe fallback currently strips room/rate/source context and breaks the "prefilled assist path" promise |
| 3-06 | Major | `## Constraints & Assumptions`, `## Risks`, `## Rehearsal Trace` | The document still treated private booking as a generic private-accommodations checkout even though the actual booking page is apartment-specific and can misroute double-room intent |
| 3-07 | Major | `## Confidence Inputs`, `## Risks`, `## Rehearsal Trace` | Analytics readiness was overstated: hostel, room-assist, private, content-entry, and banner flows still use inconsistent event contracts, so funnel-family validation would not be comparable post-ship |
| 3-08 | Moderate | `## Test Landscape` | Existing unit coverage notes overstated route confidence because two suites still assert the old `/en/book` path family rather than the current slug-resolved `/en/book-dorm-bed...` routes |

### Issues Confirmed Resolved This Round
*(None — this round addressed new forward-rehearsal defects rather than re-opening prior ledger items.)*

### Issues Carried Open (not yet resolved)
*(None — document defects were addressed in-place; remaining items are now explicit plan-stage implementation gates rather than undocumented doc gaps.)*

### Autofix Summary (Round 3)
- F1 applied: Rewrote assumptions and planning gates so the hostel secure-booking shell is explicitly conditional on env verification and staging proof of iframe viability.
- F2 applied: Expanded the risk model and confidence inputs to account for content/hybrid routing gaps, global CTA leakage, private-product checkout segmentation, and analytics inconsistency.
- F3 applied: Replaced the high-level rehearsal summary with five journey-specific forward-trace tables covering hostel-central, room-assist, private, content-entry, and locale-continuity paths, each with env-gate divergence and acceptance-testability notes.
- F4 applied: Updated execution packet, test landscape, and planning readiness so the first `/lp-do-plan` pass must gate on env proof, iframe proof, CTA routing policy, private checkout segmentation, and analytics/test sequencing.
- F5 applied: Corrected the test-landscape narrative so stale `/en/book` assertions are no longer treated as authoritative route-accuracy evidence.
- Score: 2.5 (partially credible) before autofix. Post-autofix state is suitable for `/lp-do-plan` only if the initial plan treats env proof, iframe proof, CTA routing policy, private-product routing, and analytics contracts as first-wave gated tasks rather than implementation afterthoughts.

## Round 4 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 4-01 | Major | `## Scope`, new canonical framing sections | The prior framing still mixed source surfaces, resolved intent, destination funnels, execution mode, and continuity constraints as if they were one ontology |
| 4-02 | Critical | `## Rehearsal Trace`, `## Page-Role Matrix`, `## State Continuity Contract` | Private-summary and content-entry routes could still imply that generic private intent may enter the apartment-only booking endpoint |
| 4-03 | Major | `## Hypothesis & Validation Landscape`, `## Risks`, `## Execution Routing Packet` | Analytics framing still used flat funnel labels instead of orthogonal event dimensions, which would block comparable validation across periods |
| 4-04 | Moderate | `## Confidence Inputs`, `## Rehearsal Trace` | Confidence and severity language remained too precise or too strong for unverified runtime conditions, stale tests, and missing event fields |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Critical | Secure-booking shell was treated as normative without first-class env-gate framing | Opening thesis, canonical model, page-role matrix, risks, and rehearsal trace now define the shell as an env-gated execution mode rather than a guaranteed step |
| 3-02 | Critical | Iframe viability risk was present but not integrated into the full structural model | Canonical model, page-role matrix, state continuity contract, risks, open runtime verification, and planning readiness now all carry iframe proof as an explicit gate |
| 3-03 | Critical | Content-entry and hybrid routing lacked a durable ontology | Added `## Canonical Model`, `## Page-Role Matrix`, `## State Continuity Contract`, explicit hybrid design-decision language, and open design decisions for CTA routing |
| 3-06 | Major | Private checkout was still described too generically | Document now normalises private-product taxonomy around apartment vs double private room, adds a taxonomy note, and states that the current booking endpoint is apartment-specific |
| 3-07 | Major | Analytics readiness was overstated because event dimensions were underspecified | Validation approach now requires orthogonal dimensions (`source_surface`, `source_cta`, `resolved_intent`, `destination_funnel`, `handoff_mode`, `locale`, `fallback_triggered`) |
| 3-08 | Moderate | Stale route assertions and missing event fields were still over-weighted in severity language | Rehearsal-trace labels were recalibrated so stale tests and missing analytics fields are Moderate rather than Major |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 4-02 | Critical | 1 | Apartment-only checkout must not receive generic private intent; implementation path remains open until product-specific endpoint design is chosen |
| 4-03 | Major | 1 | Orthogonal analytics dimensions are specified, but no runtime instrumentation evidence exists yet |
| 4-04 | Moderate | 1 | Runtime verification remains outstanding for env flag state, iframe viability, and fallback contract behaviour |

### Autofix Summary (Round 4)
- F1 applied: Replaced the opening thesis and inserted `## Canonical Model`, `## Page-Role Matrix`, and `## State Continuity Contract` so the document now distinguishes source surface, resolved intent, destination funnel, execution mode, and continuity state.
- F2 applied: Normalised private-product taxonomy around `hostel bed`, `apartment`, `double private room`, the `private summary` browse hub, and the apartment-specific booking endpoint.
- F3 applied: Reframed validation and observability around orthogonal analytics dimensions instead of flat funnel labels, and updated downstream routing/measurement language to use `destination_funnel`.
- F4 applied: Replaced the vague open-questions block with explicit operator/design/runtime subsections and recalibrated confidence to banded labels plus severity downgrades for stale tests and missing event fields.
- Open items remaining: hybrid intent definition, double-private-room booking endpoint design, CTA routing matrix by content family, global banner routing policy, target deployment env-flag verification, staging iframe proof, and fallback contract behaviour.

## Round 5 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 5-01 | Major | `## Canonical Model`, `## State Continuity Contract`, `## Rehearsal Trace`, `## Planning Readiness` | The required 7-dimension analytics contract still had no persistence rule for `source_cta`, and the fact-find understated that `source_surface` / `source_cta` / `resolved_intent` are dropped after the first internal route change |
| 5-02 | Major | `## State Continuity Contract`, `## Rehearsal Trace`, `## Risks`, `## Planning Readiness` | The continuity contract still claimed `UTM/deal params` were preserved, but actual code preserves `deal` selectively and drops raw inbound `utm_*` across internal route changes and secure-booking fallback |
| 5-03 | Major | `## Rehearsal Trace`, `## Open design decisions`, `## Planning Readiness` | The requested private-intent content-entry journey was not traced explicitly, leaving the safe destination rule unstated even though `/private-rooms/book` is apartment-only |
| 5-04 | Major | `## Rehearsal Trace` | Private-summary CTAs were still treated as primarily a routing problem, but the rehearsal also showed they emit no analytics event, so the step cannot produce the required 7-dimension classification |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 4-02 | Critical | Apartment-only checkout must not receive generic private intent | Rehearsal trace now separates private-intent content entry and makes the safe-route requirement explicit before any private CTA can target booking |
| 4-03 | Major | Orthogonal analytics dimensions were specified, but runtime event continuity remained underspecified | State continuity, risks, and planning prerequisites now explicitly require a persistence carrier for entry attribution across internal route changes |
| 4-04 | Moderate | Runtime verification and remaining uncertainty needed tighter wording | Updated traces and readiness gates now distinguish evidence-backed continuity gaps from runtime-only unknowns |

### Issues Carried Open (not yet resolved)
*(None — remaining items are explicit design/runtime plan gates rather than hidden documentation defects.)*

### Autofix Summary (Round 5)
- F1 applied: Added `source-cta` to the canonical continuity model and rewrote source-attribution rows so the document no longer implies that multi-step funnel attribution survives automatically.
- F2 applied: Corrected the continuity contract and journey traces so `deal` and raw inbound `utm_*` are treated separately, with the current silent-drop behavior called out where it actually occurs.
- F3 applied: Split content-entry rehearsal into hostel-intent and private-intent journeys, and added the missing open design decision for the safe generic private destination.
- F4 applied: Added the missing private-summary analytics gap and tightened planning prerequisites around attribution persistence and inbound-UTM policy.
- Score: 3.0 (planning-ready with explicit gates). Post-autofix state is suitable for `/lp-do-plan` only if the first planning pass treats attribution persistence, inbound-UTM policy, and safe private-intent routing as first-wave design contracts rather than implementation cleanup.

## Round 6 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 6-01 | Major | `## Hypothesis & Validation Landscape`, `## Canonical Model`, `## State Continuity Contract` | `source_surface` and `source_cta` still mixed surfaces with CTA-component labels, which would make the event taxonomy non-orthogonal |
| 6-02 | Major | `## Hypothesis & Validation Landscape`, `## Canonical Model`, `## Rehearsal Trace`, `## Planning Readiness` | `resolved_intent` still encoded intent, product specificity, and routing mode in one field, conflicting with the separate product taxonomy |
| 6-03 | Moderate | `## State Continuity Contract` | The continuity matrix still treated `Content-entry` as a destination funnel column instead of a source overlay |
| 6-04 | Moderate | `## State Continuity Contract` | Functional booking continuity and analytics continuity were still merged into one table, obscuring what is UX-critical versus observability-critical |
| 6-05 | Minor | `## Rehearsal Trace` | Locale continuity was still framed as a standalone journey rather than a cross-cutting constraint validated through a representative path |
| 6-06 | Moderate | `## Questions / Open design decisions` | The banner question contradicted the existing constraints section by implying `NotificationBanner` might remain outside intent-resolved routing |
| 6-07 | Minor | `## Page-Role Matrix` and routing-architecture prose | Route shorthand was not explicitly marked as shorthand, leaving a planning risk that literal path strings could leak into acceptance criteria |
| 6-08 | Major | `## Planning Readiness`, continuity taxonomy, risks | Raw inbound `utm_*` preservation was still phrased as undecided mandatory continuity instead of an explicit scope decision |
| 6-09 | Moderate | `## Confidence Inputs` | Implementation confidence remained overstated relative to the unresolved design contracts that still block full specifiability |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 6-01 | Major | `source_surface` and `source_cta` taxonomy overlapped | Replaced surface values with `homepage`, `content_page`, `dorms_browse`, `room_detail`, `private_summary`, `sitewide_shell` and CTA values with `booking_widget`, `notification_banner`, `header_primary_cta`, `sticky_cta`, `room_card`, `sticky_book_now`; propagated the corrected model across the fact-find |
| 6-02 | Major | `resolved_intent` conflated intent, product type, and routing mode | Split the model into `resolved_intent`, `product_type`, and `decision_mode`, updated the Canonical Model explanation, and rewrote repeated analytics-contract references to use the split schema |
| 6-03 | Moderate | `Content-entry` was modeled as a funnel column | Removed the `Content-entry` destination column and replaced it with a source-overlay note that explains explicit attribution propagation requirements |
| 6-04 | Moderate | Functional and observability continuity were merged | Split the continuity contract into `Booking-State Continuity` and `Attribution & Measurement Continuity` with the requested field groupings |
| 6-05 | Minor | Locale continuity was misframed as a funnel | Renamed Journey 6 to `Cross-Cutting Scenario — Locale Continuity` and added the representative-case note |
| 6-06 | Moderate | Banner policy contradicted constraints | Replaced the banner question with an in-scope routing-matrix question aligned to the existing constraints |
| 6-07 | Minor | Route shorthand lacked an explicit warning | Added the Page-Role Matrix footnote and normalized the remaining architecture prose where shorthand paths risked being read as literal implementation targets |
| 6-08 | Major | Inbound `utm_*` preservation scope was still ambiguous | Declared raw inbound `utm_*` preservation out of scope as a mandatory continuity requirement for this cycle, kept `deal` in scope, and updated the continuity and risk language accordingly |
| 6-09 | Moderate | Implementation confidence was too high | Lowered Implementation confidence from High to Medium and rewrote the evidence-basis / next-band text to reflect the unresolved design contracts |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 6-02 | Major | 1 | The split intent schema is now explicit, but planning still must lock the concrete resolver rules and storage carrier for `resolved_intent`, `product_type`, and `decision_mode` |
| 6-06 | Moderate | 1 | Banner routing is now in-scope by contract, but its exact routing matrix and resolver-sharing policy remain open design work |
| 6-08 | Moderate | 1 | Raw inbound `utm_*` preservation is now correctly non-blocking, but optional observability work may still be selected later if instrumentation capacity permits |
| 6-09 | Moderate | 1 | Implementation confidence is now recalibrated, but env-gate verification, iframe viability, private generic destination rules, and checkout segmentation still remain plan-stage gates |

### Autofix Summary (Round 6)
- F1 applied: Separated `source_surface` from `source_cta` and removed CTA-component labels from the surface axis.
- F2 applied: Split the old merged intent taxonomy into `resolved_intent`, `product_type`, and `decision_mode`, and aligned Canonical Model, validation, risks, rehearsal, and prerequisites to that schema.
- F3 applied: Removed the `Content-entry` funnel column from the continuity matrix and replaced it with a source-overlay rule.
- F4 applied: Split continuity into functional booking-state continuity versus attribution/measurement continuity.
- F5 applied: Reframed locale continuity as a cross-cutting validation scenario rather than a separate funnel.
- F6 applied: Resolved the banner-policy contradiction in favor of the constraints section and narrowed the open question to the banner routing matrix.
- F7 applied: Added the route-shorthand warning and cleaned up the most planning-sensitive shorthand references in architecture prose.
- F8 applied: Declared raw inbound `utm_*` preservation non-blocking for this cycle while keeping `deal` explicitly in scope.
- F9 applied: Lowered Implementation confidence to Medium and rewrote the supporting rationale.
- Optional fix applied: Added the `content_page` coverage note and made `content_family` an optional future sub-dimension rather than a baseline requirement.
- Remaining open items: private generic destination rule; concrete resolver/storage contract for `resolved_intent` / `product_type` / `decision_mode`; banner routing matrix; private-product checkout segmentation; env-gate verification; iframe viability proof.

## Round 7 — 2026-03-08 (Live surface audit)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 7-01 | Major | `### Entry Points` | Header CTAs (`desktop_header`, `mobile_nav`) absent from entry point inventory despite being permanent fixtures on every page and firing `fireCtaClick` events |
| 7-02 | Major | `### Entry Points` / `### Explicit Sales Path Inventory` | `OffersModal` absent from inventory; click-to-dismiss global modal with its own CTA event (`offers_modal_reserve`) routing to hostel booking |
| 7-03 | Major | `### Entry Points` / `### Explicit Sales Path Inventory` | Deals page (`DealsPageContent.tsx`) absent; only Brikette surface that injects a deal attribution code into the hostel funnel at source |
| 7-04 | Moderate | `### Entry Points` / private product path | `/private-rooms/private-stay` subpage absent; private-intent content surface routing to `getPrivateBookingPath(lang)` + WhatsApp |
| 7-05 | Moderate | `### Recommended Validation Approach` analytics table | `source_surface` missing `deals_page`; `source_cta` missing `mobile_nav_cta` and `offers_modal_reserve` and `deals_page_reserve` |
| 7-06 | Minor | `### Patterns & Conventions Observed` | Global CTA pattern note only referenced `NotificationBanner`; omitted `Header.tsx` and `OffersModal` as equally non-compliant sitewide surfaces |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 7-01 | Major | Header CTAs absent | Added `Header.tsx` to Entry Points, Key Modules, hostel central additional surfaces section, and Patterns; added `header_primary_cta (desktop)` and `mobile_nav_cta (mobile)` to source_cta values |
| 7-02 | Major | OffersModal absent | Added `OffersModal.tsx` to Entry Points, Key Modules, hostel central additional surfaces section, Patterns; added `offers_modal_reserve` to source_cta values |
| 7-03 | Major | Deals page absent | Added `DealsPageContent.tsx` to Entry Points, Key Modules, new sitewide surfaces section, Patterns; added `deals_page` to source_surface values and `deals_page_reserve` to source_cta values |
| 7-04 | Moderate | private-stay subpage absent | Added `PrivateStayContent.tsx` to Entry Points, Key Modules, private product path section (step 3), and Patterns |
| 7-05 | Moderate | Analytics taxonomy gaps | Updated source_surface and source_cta rows in the analytics dimensions table; expanded the coverage note under the table |
| 7-06 | Minor | Global CTA pattern incomplete | Expanded Patterns note to cover all three non-compliant sitewide surfaces |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 6-02 | Major | 2 | Split intent schema now explicit; resolver rules and storage carrier for `resolved_intent` / `product_type` / `decision_mode` still not locked |
| 6-06 | Moderate | 2 | Banner routing in-scope; exact routing matrix and resolver-sharing policy remain open design decisions |
| 6-08 | Moderate | 2 | Raw inbound `utm_*` preservation correctly non-blocking; optional observability work deferred to plan stage |
| 6-09 | Moderate | 2 | Implementation confidence recalibrated; env-gate verification, iframe viability, private checkout segmentation still plan-stage gates |

### Autofix Summary (Round 7)
- Added 4 missing entry points to `### Entry Points` (Header, OffersModal, DealsPageContent, PrivateStayContent, StickyBookNow explicit mention).
- Added new `#### Hostel central path — additional sitewide entry surfaces` section documenting Header CTAs, OffersModal, and Deals page with separate evidence list.
- Updated `#### Hostel assist paths` to clarify StickyBookNow vs RoomCard event contract distinction; added StickyBookNow to evidence.
- Updated `#### Private product path` to add private-stay subpage as step 3 with evidence.
- Updated `### Key Modules / Files` with 5 new entries (Header, OffersModal, DealsPageContent, DealsBanner display-only note, PrivateStayContent, StickyBookNow).
- Updated `### Patterns & Conventions Observed` — expanded global CTA pattern note and added two new pattern observations (deals page deal-attribution path, private-stay as private-intent content surface).
- Updated analytics dimensions table: added `deals_page` to source_surface; added `mobile_nav_cta`, `offers_modal_reserve`, `deals_page_reserve` to source_cta.
- Expanded analytics taxonomy note to clarify `deals_page` vs `sitewide_shell` vs `content_page` boundary and `private_summary` coverage of both private-rooms summary and private-stay.
- Updated Risks row for global CTA surface misalignment to explicitly name all three non-compliant surfaces.

## Round 7b — 2026-03-08 (Breakpoint sweep integration)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 7b-01 | Major | `### Coverage Gaps` / `## Risks` | Responsive layout gaps from breakpoint sweep not in fact-find — mobile CTA truncation (BRK-01) and rooms-section padding (BRK-03) are direct funnel blockers on the primary device segment |
| 7b-02 | Moderate | `## Confidence Inputs / Impact` | Impact evidence basis stated as "structural observation only" but breakpoint sweep provided rendered evidence of mobile-specific friction |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 7b-01 | Major | Breakpoint findings missing | Added `### Responsive Layout Gaps` subsection to Evidence Audit with 7 funnel-relevant BRK findings; added 4 new risk rows covering BRK-01, BRK-03, BRK-02, BRK-06 |
| 7b-02 | Moderate | Impact confidence overstated | Updated Impact confidence evidence basis to cite breakpoint sweep findings as rendered evidence; added prerequisite to fix BRK-01/BRK-03 before measuring |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 6-02 | Major | 3 | Intent schema split is explicit; resolver rules and storage carrier still not locked |
| 6-06 | Moderate | 3 | Banner routing matrix remains open design work |
| 6-08 | Moderate | 3 | Raw utm_* preservation non-blocking; deferred to plan stage |
| 6-09 | Moderate | 3 | Implementation confidence recalibrated; env-gate, iframe, private checkout still plan-stage gates |

## Round Plan-R1 — 2026-03-08 (First plan critique)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| PR-01 | Minor | Frontmatter `Supporting-Skills` | `lp-design-qa` listed but never cited in any task's Execution-Skill field; no invocation rationale |
| PR-02 | Minor | Frontmatter `Confidence-Method` | Stated `min()` method does not produce 75% from task data; no weighting calculation shown |
| PR-03 | Minor | TASK-05 planning validation, line 361 | `deals_page` incorrectly stated as absent from `ctaLocation` enum — it is already present at `ga4-events.ts` line 31 |
| PR-04 | Moderate | TASK-05 Blocks / TASK-12 Depends-on | TASK-12 calls `fireEntryAttribution` (TASK-05 output) but TASK-05 did not block TASK-12; dependency gap |
| PR-05 | Major | TASK-06 Blocks / TASK-12 acceptance | TASK-12 acceptance had no `writeAttribution` calls; TASK-06 did not block TASK-12; carrier is not wired for private-product CTAs |
| PR-07 | Moderate | TASK-09 Scouts | `buildHostelBookingTarget()` is a phantom function not present in the codebase; build agent would fail to find or create it correctly |
| PR-08 | Moderate | TASK-12a + Frontmatter | DECISION task requiring operator input under `Auto-Build-Intent: plan+auto` had no explicit auto-build chain-break marker |
| PR-09 | Moderate | TASK-13 horizon assumptions | Missing explicit fork: "if env gate OFF → TASK-14 is de-scoped" as a replan outcome, not just a confidence adjustment |
| PR-10 | Minor | Observability section | No pre-instrumentation baseline measurement window specified; post-Wave-4 window was ambiguous |
| PR-11 | Moderate | Frontmatter `Status: Active` | Sub-80% overall confidence had no explicit rationale for Active status per Plan Lens requirement |

### Issues Confirmed Resolved This Round (fact-find carryover)
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 6-02 | Major | Resolver rules and storage carrier not locked | Plan encodes full `IntentResolution` interface, routing matrix for all 16 `ctaLocation` values, and carrier API (`writeAttribution`/`readAttribution`/`clearAttribution`) with typed `EntryAttributionCarrierPayload` |
| 6-06 | Moderate | Banner routing matrix still open design work | TASK-11 encodes the banner routing policy: `NotificationBanner` routes to deals page; attribution records actual destination accurately; policy is locked |
| 6-08 | Moderate | Raw utm_* preservation scope ambiguous | Plan's Non-goals section explicitly excludes raw `utm_*` preservation; `deal` param preservation is in-scope where already supported |
| 6-09 | Moderate | Env-gate verification, iframe viability, private checkout still plan-stage gates | TASK-07, TASK-08, TASK-12a/12 respectively handle these; each has a validation contract and explicit downstream gate |

### Issues Confirmed Resolved This Round (plan-critique issues)
| ID | Severity | Summary | How resolved |
|---|---|---|---|
| PR-01 | Minor | `lp-design-qa` unjustified in Supporting-Skills | Removed from frontmatter |
| PR-02 | Minor | Confidence-Method did not match calculation | Replaced with accurate weighted-average description; calculation section updated |
| PR-03 | Minor | `deals_page` incorrectly stated as missing from enum | Planning validation note corrected; Scouts note updated to reflect `deals_page` already present |
| PR-04 | Moderate | TASK-12 missing dependency on TASK-05 | TASK-05 Blocks updated to include TASK-12; TASK-12 Depends-on updated in table and task detail |
| PR-05 | Major | TASK-12 missing `writeAttribution` + TASK-06 dependency | TASK-06 Blocks updated to include TASK-12; TASK-12 Depends-on updated; `writeAttribution` call added to TASK-12 acceptance criteria; TC-07 added for carrier write verification |
| PR-07 | Moderate | Phantom `buildHostelBookingTarget()` function | Scouts note rewritten to reference `octorateCustomPage.ts` and instruct the agent to read that file before creating any URL-dispatch wrapper |
| PR-08 | Moderate | No auto-build chain-break marker on TASK-12a | `Auto-build chain note` added to TASK-12a task body; Parallelism Guide Wave 4 note updated |
| PR-09 | Moderate | TASK-13 missing env-gate-OFF de-scope fork | Horizon assumptions updated with explicit fork: env gate OFF → TASK-14 de-scoped |
| PR-10 | Minor | No pre-instrumentation baseline window | Observability metrics section updated with explicit "post-Wave-1, pre-Wave-4, minimum 2-week" baseline window |
| PR-11 | Moderate | Active status with sub-80% confidence unexplained | `Status-confidence-note` field added to frontmatter explaining the drag sources and why Active is correct |

### Issues Carried Open (not yet resolved)
*(None — all plan-R1 issues resolved in this round; all prior fact-find carryovers resolved by the plan itself)*

### Autofix Summary (Plan-R1)
- AF-1: Frontmatter `Supporting-Skills` — removed `lp-design-qa`; `Confidence-Method` description updated to accurate weighted-average.
- AF-2: Frontmatter — added `Status-confidence-note` field explaining sub-80% Active rationale.
- AF-3: Task Summary table — TASK-05 Blocks updated (added TASK-12); TASK-06 Blocks updated (added TASK-12); TASK-12 Depends-on updated (added TASK-05, TASK-06).
- AF-4: TASK-05 planning validation note — corrected false claim that `deals_page` is absent from `ctaLocation` enum; corrected Scouts note accordingly.
- AF-5: TASK-05 task detail Blocks field — updated to include TASK-12.
- AF-6: TASK-06 task detail Blocks field — updated to include TASK-12.
- AF-7: TASK-12 task detail Depends-on — updated to include TASK-05 and TASK-06.
- AF-8: TASK-12 acceptance criteria — added `writeAttribution` call requirement for all private-product CTAs.
- AF-9: TASK-12 validation contract — added TC-07 covering carrier write verification.
- AF-10: TASK-09 Scouts — replaced phantom `buildHostelBookingTarget()` with instruction to read `octorateCustomPage.ts` before constructing any URL-dispatch wrapper.
- AF-11: TASK-12a task body — added `Auto-build chain note` marking the task as a non-agent-resolvable gate requiring operator confirmation before TASK-12 starts.
- AF-12: Parallelism Guide Wave 4 TASK-12a row — updated to state "agent produces decision document then PAUSES."
- AF-13: TASK-13 horizon assumptions — added explicit env-gate-OFF → TASK-14 de-scope fork.
- AF-14: Observability metrics — added pre-Wave-4 baseline measurement window specification.
- AF-15: Overall-confidence Calculation note — updated to match revised Confidence-Method description.
- AF-16: Rehearsal Trace TASK-12 row — updated preconditions and notes to reflect new TASK-05/06 dependencies.
- AF-17: Decision Log item 5 — updated consumer-tracing note to include TASK-12.
- Score: 4.1 / 5.0 pre-fix. Post-fix state is build-ready.

## Round Plan-R2 — 2026-03-08 (Second plan critique, operator-authored)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| R2-01 | Critical | TASK-05 schema, TASK-11 Acceptance/Scouts | `sitewide_shell` and `deals_page` incorrectly placed on the `ctaLocation` axis; they belong to `source_surface` only — two orthogonal axes were conflated |
| R2-02 | Critical | TASK-05 Acceptance, TASK-10/11/12/14 | `fireEntryAttribution` as a separate GA4 emitter creates double-counting risk; plan had both `fireCtaClick` and `fireEntryAttribution` wired to callers |
| R2-03 | Major | TASK-10, TASK-11 Acceptance | No task added source attribution to the normal-path `handoff_to_engine` event; attribution carrier was written at click but never read at handoff on the happy path |
| R2-04 | Major | TASK-06 Acceptance, TASK-10/11 Scouts | `writeAttribution` was described as "also writing `_bsrc`/`_bint` to the current URL query string" — writing to the current page URL does not propagate params to the next route |
| R2-05 | Major | TASK-09 Acceptance/Scouts, TASK-10/11 | Resolver return type still listed `destination_url`; resolver was described as consuming `octorateCustomPage.ts` — resolver must return abstract intent only |
| R2-06 | Major | Summary, Goals, TASK-11 Acceptance | Contradiction between Summary/Goals ("sitewide CTAs route through intent resolver distinguishing hostel/private/undetermined") and TASK-11 ("routing remains unchanged"); sitewide surfaces are hostel-only today |
| R2-07 | Moderate | TASK-05, TASK-11 | `NotificationBanner` routes to `/en/deals` (intermediate) not directly to hostel compare; schema had no field to distinguish intermediate from final-funnel destination |
| R2-08 | Moderate | TASK-12a recommendation, TASK-12 TC-02 | Default fallback for unconfirmed double-private-room rate codes was apartment checkout — unsafe; risks wrong product being reserved |
| R2-09 | Moderate | TASK-05 Acceptance | Type definitions were loose: `product_type: string | null`, `handoff_mode` optional with no constraint, `fallback_triggered: boolean | undefined`; TC-04 in TASK-14 used `source_surface: null` which contradicts the enum |
| R2-10 | Moderate | TASK-01–04 Validation contracts | Layout measurement assertions (`scrollWidth === offsetWidth`, computed pixel padding, computed 44px) don't work in Jest/jsdom; test strategy needed correction |
| R2-11 | Minor | Parallelism Guide wave labels, Rehearsal Trace, Observability, Frontmatter | Several secondary inconsistencies: TASK-07/08 labeled Wave 3 elsewhere, `deals_page` ctaLocation contradiction in Rehearsal Trace, SSR constraint applied to pure resolver, TASK-08 missing TASK-07 conditional dependency, baseline window post-Wave-1 instead of post-Wave-2, Auto-build eligible stated as "Yes" unconditionally |

### Issues Confirmed Resolved This Round
| ID | Severity | Summary | How resolved |
|---|---|---|---|
| R2-01 | Critical | `sitewide_shell` / `deals_page` on wrong axis | TASK-05 schema rewritten: new `GA4_ENUMS.sourceSurface` enum array introduced; `sitewide_shell` and `deals_page` placed on `source_surface` axis only. `ctaLocation` unchanged. Fact-Find Reference, Rehearsal Trace, and TASK-11 all updated. |
| R2-02 | Critical | Double-counting from separate `fireEntryAttribution` emitter | `fireEntryAttribution` removed from all tasks. TASK-05 now enriches `fireCtaClick` with optional third arg `entryAttribution?: EntryAttributionParams`. One `cta_click` per click. TASK-05 Acceptance, Execution plan, all TC-XX, and all consumer tasks (TASK-10/11/12/14) updated. Decision Log updated. |
| R2-03 | Major | Normal-path handoff event missing source attribution | TASK-10 and TASK-11 Acceptance updated with explicit criterion: handoff event (`begin_checkout` / `handoff_to_engine`) reads attribution carrier and includes `source_surface`, `source_cta`, `resolved_intent`, `product_type`, `decision_mode`. TC-02b added to TASK-10; TC-07 added to TASK-11. |
| R2-04 | Major | URL fallback wrote to current page URL | TASK-06 Acceptance updated: `decorateUrlWithAttribution(url: string, payload: EntryAttributionPayload): string` helper introduced; does not mutate current URL; callers (TASK-10/11) use it when computing `href` and `router.push` targets. TC-05 updated. TASK-10 Execution plan updated. |
| R2-05 | Major | Resolver returned `destination_url`; consumed `octorateCustomPage.ts` | TASK-09 `IntentResolution` type confirmed no `destination_url`; Scouts rewritten to remove `octorateCustomPage.ts` as resolver input; TC-01 updated; TASK-09 Edge Cases SSR note corrected. Rehearsal Trace TASK-09 row updated. |
| R2-06 | Major | Summary/Goals overclaim vs TASK-11 scope | Summary rewritten to state sitewide CTAs are brought under analytics taxonomy; routing remains hostel-only; private override deferred. Goals item 4 updated. TASK-11 Acceptance adds explicit routing-scope note and "private override deferred" statement. |
| R2-07 | Moderate | No `next_page` field for intermediate destinations | `next_page?: string | null` added to `EntryAttributionParams` in TASK-05. TASK-11 Acceptance updated: `NotificationBanner` emits `next_page: "/[lang]/deals"` when routing to deals. TC-01 in TASK-11 updated. Edge Cases updated to use `next_page` instead of `destination_url`. |
| R2-08 | Moderate | Unsafe double-private-room fallback to apartment checkout | TASK-12a Recommendation updated: if rate codes unconfirmed, default to `getPrivateRoomsPath(lang)` + WhatsApp, NOT apartment checkout. TASK-12 TC-02 updated to reflect safer fallback. |
| R2-09 | Moderate | Loose type definitions; TC-04 `source_surface: null` contradiction | `product_type` frozen as `'hostel_bed' | 'apartment' | 'double_private_room' | null` literal union. `fallback_triggered` required as `boolean`. TC-07 added to TASK-05 to enforce literal union at typecheck. TASK-14 TC-04 corrected: `source_surface: "room_detail"` with `fallback_triggered: true` (not `source_surface: null`). |
| R2-10 | Moderate | Wave 1 layout assertions don't work in Jest/jsdom | TASK-01 TC-01–03, TASK-02 TC-01–02, TASK-03 TC note, TASK-04 TC-01–02 all updated to use class-string assertions (`toHaveClass`, `not.toHaveClass`). Pixel/computed-size checks moved to "manual staging verification or Playwright smoke test" notes. |
| R2-11 | Minor | Secondary inconsistencies | Parallelism Guide Wave 2 note clarified that TASK-07/08 are Wave 2 (not Wave 3). Rehearsal Trace GA4 entry-attribution row updated: `deals_page` is `source_surface` only. TASK-09 Edge Cases SSR note corrected (resolver is SSR-safe; constraint is on `readAttribution`). TASK-08 Notes section updated with TASK-07 conditional dependency. Observability baseline updated to post-Wave-2. `Auto-build eligible` updated to conditional (hard pause at TASK-12a). |

### Issues Carried Open (not yet resolved)
*(None from this round — all R2-01 through R2-11 applied inline.)*

Prior plan critique carried-open items status:
- PR-03: Note corrected in Plan-R1 and further tightened in Plan-R2 (axis separation makes it explicit that `deals_page` is a `source_surface` value and also a valid `ctaLocation` value — both on different axes, both correct).
- PR-07, PR-08, PR-09, PR-11: All resolved in Plan-R1 by the autofix agent.

### Autofix Summary (Plan-R2)
- AF-1: TASK-05 schema — separated `ctaLocation` and `source_surface` axes explicitly; introduced `GA4_ENUMS.sourceSurface` enum; removed `sitewide_shell` from `ctaLocation` scope.
- AF-2: Removed `fireEntryAttribution` from all tasks; replaced with enriched `fireCtaClick` (third arg pattern); updated TASK-05 Acceptance, Execution plan, TC-01–08, What-makes-90%, and all consumer tasks.
- AF-3: Added normal-path handoff consumer criterion to TASK-10 (TC-02b) and TASK-11 (TC-07).
- AF-4: TASK-06 — replaced URL-mutation description with `decorateUrlWithAttribution(url, payload): string` helper; updated TC-05; updated TASK-10 Execution plan to reference `decorateUrlWithAttribution`.
- AF-5: TASK-09 — confirmed no `destination_url` in return type; updated Scouts to remove `octorateCustomPage.ts` as resolver input; corrected SSR constraint wording.
- AF-6: Summary and Goals updated to remove sitewide-CTA/private-intent overclaim; TASK-11 Acceptance updated with explicit routing-scope and deferred-private-override note.
- AF-7: `next_page?: string | null` added to `EntryAttributionParams`; TASK-11 Acceptance and TC-01 updated for NotificationBanner intermediate destination.
- AF-8: TASK-12a Recommendation updated with safer double-private-room fallback (private summary + WhatsApp); TASK-12 TC-02 updated.
- AF-9: `product_type` frozen to literal union; `fallback_triggered` required as boolean; TASK-05 TC-07 added; TASK-14 TC-04 corrected.
- AF-10: TASK-01–04 validation contracts updated to class-string assertions; layout measurement assertions removed from unit-test scope.
- AF-11: Parallelism Guide Wave 2 note clarified; Rehearsal Trace updated; TASK-09 Edge Cases SSR note corrected; TASK-08 Notes TASK-07 conditional dependency added; Observability baseline moved to post-Wave-2; `Auto-build eligible` made conditional.
- AF-12: Fact-Find Reference note updated: `sitewide_shell`/`deals_page` axis placement clarified.
- AF-13: Decision Log entry 4 updated (no separate `fireEntryAttribution`); entry 5 consumer tracing updated.
- AF-14: TASK-11 Planning validation `Checks run` updated (enriched `fireCtaClick` instead of `fireEntryAttribution`).
- Score: Operator-identified issues R2-01/02 are Critical — prior plan was not build-ready without these corrections. Post-fix state is build-ready. All 11 FIX items applied.
