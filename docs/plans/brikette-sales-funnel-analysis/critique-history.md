# Critique History: brikette-sales-funnel-analysis

## Round 1 — 2026-03-06

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | TASK-08C sequencing | Live Cloudflare convergence was still positioned against a pre-localization public route contract. |
| 1-02 | Major | Route-localization scope | The plan had no explicit task tranche for top-level, room, and guide slug English-fallback debt despite operator requirement. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | TASK-08C sequencing | Inserted `TASK-13A` through `TASK-13E` ahead of `TASK-08C` and refreshed dependencies, critical path, and rehearsal trace. |
| 1-02 | Major | Route-localization scope | Added explicit route-localization audit, top-level slug, room slug, guide slug, and checkpoint tasks with acceptance and validation contracts. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-03 | Moderate | 1 | Legal-route slug policy intent and the explicit shared-spelling allowlist still need to be settled within TASK-13A scouts and downstream implementation. |

## Round 2 — 2026-03-06

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | TASK-13D readiness | Guide slug localization was below the implement confidence floor and still carried open-ended discovery in scout notes. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-03 | Moderate | Legal-route slug policy intent and shared-spelling allowlist | Added formal precursor `TASK-13F` to freeze policy, allowlist, and apartment-route consumers before `TASK-13B`. |
| 2-01 | Moderate | TASK-13D readiness | Added formal precursor `TASK-13G`, removed inline scout ambiguity, and raised `TASK-13D` confidence to `80%`. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 2-02 | Moderate | 1 | Final shared-spelling and legal-route outcomes remain open until `TASK-13F` evidence is produced. |

## Round 3 — 2026-03-07

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | Canonical inventory | Public SEO inventory still includes hostel booking pages that are marked `noindex,follow`, and includes `/{lang}/{privateRoomsSlug}/book` even though that route is only a redirect helper. |
| 3-02 | Major | Shared slug sources | `packages/ui` still encodes deprecated booking/private-booking slug contracts and can leak stale Brikette URLs after route localization. |
| 3-03 | Moderate | Private-room child routes | The route-localization audit does not yet cover the private-room child route family, which still emits English child slugs and a duplicate-semantics `/apartment` page. |
| 3-04 | Major | No-JS fallback | Hostel booking entry routes still hardcode the broken Octorate fallback URL. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-02 | Moderate | Shared-spelling and legal-route outcomes remained open | Top-level route-localization tranche closed; remaining route debt is now narrowed to canonical inventory, shared slug sources, and private-room child routes. |
| 3-01 | Major | Canonical inventory included noindex and redirect-helper URLs | Added `TASK-14C`; canonical public inventory now excludes top-level hostel booking pages and `/{lang}/{privateRoomsSlug}/book` while preserving valid app routes. |
| 3-02 | Major | `packages/ui` still encoded deprecated booking/private-booking slug contracts | Added and completed `TASK-14D`; shared `translatePath()` and slug map now match the Brikette app contract for booking/private-booking paths. |
| 3-04 | Major | Hostel booking entry routes still hardcoded the broken Octorate fallback URL | `TASK-14C` moved hostel noscript fallbacks to the shared live Octorate calendar URL (`codice=45111`) and tightened the SSR audit pattern. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 3-03 | Moderate | 1 | Private-room child route policy still needs an explicit allowlist/localization decision. |

## Round 4 — 2026-03-07

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 4-01 | Major | Private-room child route implementation | The contract is now frozen, but the localized private-room child slug model still needs to be implemented before live redirect convergence can be considered complete. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-03 | Moderate | Private-room child route policy still needed an explicit allowlist/localization decision | `TASK-14E` froze the policy: keep the private-room root as the summary hub, keep a distinct apartment detail child page, and localize all child slugs rather than allowlisting English children. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 4-01 | Major | 1 | The frozen private-room child contract still needs a dedicated implementation task covering localized child slugs, canonical redirects, and audit/test updates. |

## Round 5 — 2026-03-07

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 5-01 | Moderate | Remaining rollout topology | `TASK-14B` was still carrying external staging proof inside a completed repo implementation tranche, which blurred the real next runnable work and left `TASK-08C` with an imprecise dependency chain. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 5-01 | Moderate | `TASK-14B` still bundled repo implementation with external staging proof | Replan round 5 marked `TASK-14B` complete, added explicit staging-proof precursor `TASK-14G`, and updated `TASK-08C` to depend on `TASK-14F` plus `TASK-14G` only. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 4-01 | Major | 2 | The frozen private-room child contract still needs a dedicated implementation task covering localized child slugs, canonical redirects, and audit/test updates. |

## Round 6 — 2026-03-07

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 6-01 | Moderate | Post-deploy controls | The rollout was live, but the automated guard stack still only sampled route reachability and strict routes; it did not yet enforce canonical-tag correctness, sitemap inclusion, or intentional `404` aliases after deploy. |
| 6-02 | Moderate | Control-boundary clarity | The next guard tranche risked accidentally slowing direct `wrangler` hotfix deploys by conflating CI verification with manual operator deploy flow. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 4-01 | Major | The frozen private-room child contract still needed dedicated implementation | `TASK-14F` completed localized child slugs, redirects, audit updates, staging proof, and live rollout. |
| 6-01 | Moderate | Post-deploy controls did not enforce canonical-tag, sitemap, or intentional-404 contracts | Added `TASK-15A`/`TASK-15B`; reusable CI post-deploy checks now accept canonical-tag, sitemap-required, and expected-404 route sets, and Brikette staging/production pass those checks. |
| 6-02 | Moderate | CI hardening risked slowing direct `wrangler` deploys | The new checks were added only to reusable CI workflow inputs; direct `wrangler pages deploy` remains unchanged and intentionally fast. |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 6-03 | Moderate | 1 | Rendered nav/footer/content links are still validated by manual staging audit rather than a dedicated automated canonical-link guard. |

## Round 7 — 2026-03-07

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 7-01 | Moderate | Rendered-link coverage | The remaining control gap was explicit automated coverage for rendered nav/footer/content links against the canonical route contract. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 6-03 | Moderate | Rendered nav/footer/content links still relied on manual staging audit | Added `TASK-15C`: a deterministic built-HTML audit over representative homepage, booking, private-room, and guide pages that fails on internal links outside the canonical route inventory; CI build paths now run it. |
| 7-01 | Moderate | Rendered-link canonical coverage was still missing | `verify-rendered-link-canonicals.ts` now validates 13 representative pages and 410 internal links with `0` invalid links on the current export. |

### Issues Carried Open (not yet resolved)
| ID | Severity | Target | Summary |
|---|---|---|---|
| 8-01 | High | Booking widget/calendar surfaces | Live homepage and booking flows still expose raw `bookingControls.*Guests` keys and segmented native date labels (`Day Day`, `Month Month`, `Year Year`) despite prior funnel cleanup work. |
| 8-02 | Moderate | Booking/deals localization quality | Live non-English booking UI still contains English filter copy, and the live deals page still exposes the `Expired deals` control. |

## Round 8 — 2026-03-07

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 8-01 | High | Booking widget/calendar surfaces still exposed raw guest-stepper keys and segmented native date labels | `TASK-16A` moved the hidden native date inputs out of the accessibility tree and centralized guest-stepper fallback resolution across booking widget, booking page, and apartment booking surfaces. Staging verification confirmed the raw-key/date-label leaks are gone. |
| 8-02 | Moderate | Non-English booking UI still contained English filter copy, and the deals page still exposed the expired-deals control | `TASK-16B` localized the booking-surface filter/stepper/carousel labels, `TASK-16C` removed the expired-deals panel from the rendered deals page and visible-promotion analytics, and `TASK-16D` hardened `/api/availability` and `/api/health` to answer `HEAD` as well as `GET`. |

### Issues Carried Open (not yet resolved)
| ID | Severity | Target | Summary |
|---|---|---|---|
| - | - | - | None. |

## Round 9 — 2026-03-07

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 9-01 | Moderate | Shared-shell localization | Post-rollout staging audit still found English leakage outside the booking/deals/API surfaces: the theme toggle announced English labels on localized pages, the footer `Book direct` CTA resolved via the wrong namespace, and homepage featured-guide cards preferred stale generated English labels over the localized guides bundle. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 9-01 | Moderate | Shared-shell localization still leaked English on localized commercial surfaces | `TASK-16E` localized the shared theme-toggle labels in the core i18n bundle, moved the footer CTA onto the footer locale contract, and changed homepage featured-guide labels to resolve from the active localized guides bundle before any generated fallback. |

### Issues Carried Open (not yet resolved)
| ID | Severity | Target | Summary |
|---|---|---|---|
| - | - | - | None. |

## Round 10 — 2026-03-07

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 10-01 | High | Static-export localization | Staging still emitted English/raw-key commercial copy on localized `/it` and `/it/prenota` pages because Brikette app namespaces were not primed into the client i18n instance before static-rendered shell/home/book components executed. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 10-01 | High | Localized static HTML still leaked English/raw-key shell and booking copy before hydration | `TASK-16F` introduced a server-to-client app-namespace snapshot contract for the shared shell plus homepage/booking surfaces, added a deterministic static-export localization audit, and closed the missing `bookPage.noscript.octorateDirectBooking` key across locales. |

### Issues Carried Open (not yet resolved)
| ID | Severity | Target | Summary |
|---|---|---|---|
| - | - | - | None. |
