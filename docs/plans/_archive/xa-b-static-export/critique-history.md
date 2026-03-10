# Critique History: xa-b-static-export

## Round 1 — 2026-02-27 (fact-find critique)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | TASK-03 seed, Risks | xaSearchService has graceful fallback to XA_PRODUCTS bundle; URL change is optional, not mandatory |
| 1-02 | Moderate | TASK-01 seed | requireEnv guards for NEXTAUTH_SECRET/SESSION_SECRET/CART_COOKIE_SECRET labelled optional — mandatory removal |
| 1-03 | Moderate | TASK-08 seed, Observability | CF Pages health check URL non-deterministic; "update to xa-b-preview.pages.dev" not actionable |
| 1-04 | Minor | TASK-08 seed | wrangler.toml should be deleted, not "updated to CF Pages format" |
| 1-05 | Minor | Risks | CF Pages 20k file limit not mentioned; __next.* cleanup step missing |
| 1-06 | Minor | Resolved Q missing | brands/[handle] redirect() in static export behavior not stated precisely |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| — | — | (first run) | — |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| — | — | — | — |

---

## Round 2 — 2026-02-27 (plan critique)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | TASK-01 TC-01 | TC-01 uses `require()` on an ESM `.mjs` module — throws ERR_REQUIRE_ESM; replaced with grep check |
| 2-02 | Moderate | TASK-08 Acceptance | Acceptance block first stated "removes deploy-drop-worker dependency" then immediately reversed — builder trap; cleaned to single correct statement |
| 2-03 | Moderate | TASK-04, TASK-05, Parallelism Guide | Both tasks modify `designer/[slug]/page.tsx` in same wave without declared dependency; TASK-05 Depends on updated to include TASK-04; Parallelism Guide serialized into Wave 3 and 4 |
| 2-04 | Moderate | TASK-03 Affects, TASK-03 Green step | TASK-03 execution plan deleted api/access/ and api/access-request/ dirs not in its Affects field; scope gate conflict with TASK-07; removed from TASK-03 Green step |
| 2-05 | Minor | TASK-05 Acceptance | "wrapped in `<Suspense>` in its parent" ambiguous; design spec clarifies correctly — not autofixed (no decision impact) |
| 2-06 | Minor | TASK-06 TC-03 | TC-03 justification "middleware.ts import of xaI18n is removed with the file" backwards — concern is imports OF middleware.ts not IN it — not autofixed (no decision impact) |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Moderate | URL change optional | plan.md TASK-03 correctly scoped to route deletion only; xaSearchService fallback documented |
| 1-02 | Moderate | requireEnv mandatory removal | plan.md TASK-01 explicitly marks removal as mandatory in acceptance and execution plan |
| 1-03 | Moderate | Health check non-deterministic | plan.md TASK-08 uses build-output presence check instead of URL-based health check |
| 1-04 | Minor | wrangler.toml deletion | plan.md TASK-08 says "delete" (not update) |
| 1-05 | Minor | __next.* cleanup missing | plan.md TASK-08 has explicit `find out -name '__next.*' -type f -delete` step |
| 1-06 | Minor | brands/[handle] redirect behavior | plan.md TASK-04 notes and Simulation Trace document meta-refresh behavior |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| — | — | — | — |
