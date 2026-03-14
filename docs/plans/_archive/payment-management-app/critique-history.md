# Critique History: payment-management-app

## Round 1 — 2026-03-13

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Open Questions (Q2) | "Real-time vs on-demand order write" was agent-resolvable; doc left it open unnecessarily |
| 1-02 | Major | Engineering Coverage Matrix | Security row missing credential rotation procedure |
| 1-03 | Major | Evidence Audit | No cross-comparison of session auth patterns across CF Worker apps |
| 1-04 | Moderate | Confidence Inputs (Approach) | Confidence note referenced unresolved Q2 after Q2 was moved to Resolved |
| 1-05 | Moderate | Risks table | Risks table row for "Real-time order write scope creep" referenced "open Q2" after Q2 was resolved |
| 1-06 | Moderate | Delivery & Channel Landscape | Section stub was absent; required for schema completeness |
| 1-07 | Minor | Planning Constraints | `StripeWebhookEvent` collision note present in constraints but not explicitly called out in task seeds |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | Q2 agent-resolvable deferral | Moved to Resolved Questions with recommended real-time dual-write approach and rationale |
| 1-02 | Major | Missing credential rotation procedure | Added minimum viable rotation procedure to Security row in Engineering Coverage Matrix |
| 1-04 | Moderate | Orphaned Q2 reference in Confidence Inputs / Approach | Replaced with Axerve Open Q1 reference |
| 1-05 | Moderate | Orphaned Q2 reference in Risks table | Updated row: likelihood lowered to Low; mitigation updated to reflect resolved real-time dual-write approach |
| 1-06 | Moderate | Missing Delivery & Channel Landscape section | Added stub section noting N/A for internal tool |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-03 | Moderate | 1 | Cross-app session auth comparison is informally covered by inventory-uploader references but not an explicit comparative table; acceptable for a fact-find |
| 1-07 | Minor | 1 | `StripeWebhookEvent` collision called out in constraints; task seeds do not list a dedicated migration rename task (deferred to plan phase) |

### Critique Score: 4.0
Verdict: credible. Proceed to /lp-do-analysis.

## Round 2 — 2026-03-13 (analysis.md, 3 sub-rounds via codemoot)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Critical→resolved | Chosen Approach / Phase 5 | Option A retains Caryina's Axerve route permanently; Phase 5 removal claim was overstated; outcome contract conflicted |
| 2-02 | Major | End-State (Refund/Axerve) | Caryina internal proxy path `https://caryina-host/admin/api/refunds-internal` blocked by cookie gate (`apps/caryina/src/proxy.ts`) |
| 2-03 | Major | Constraints | Session auth fails open on KV unavailability (`session.ts:87`); unacceptable for payment surface |
| 2-04 | Major | End-State / Data | Webhook log proposal created duplicate pipeline; `stripeWebhookEventStore.ts` already exists in platform-core |
| 2-05 | Moderate | Testing/validation row | "9 tests valid without modification" overclaim; Phase 2 proxy changes break existing test shapes |
| 2-06 | Moderate | Goals | "Per-shop provider switching" overstated; CMP hardcodes Stripe in `shop.json`; not switchable in v1 |
| 2-07 | Moderate | Fact-Find Reference line 74 | Stale `PaymentWebhookEvent` rename reference after webhook model decision changed |
| 2-08 | Moderate | Rollout/rollback row | Phase 2 described as Stripe-only proxy; actual design is unified proxy for all refund types |
| 2-09 | Moderate | Phase 3 sequencing | Caryina's config read from Payment Manager had no s2s auth contract; session gate would block the call |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Critical | Phase 5 scope overstated | Outcome contract updated; Phase 5 now explicitly retains Axerve route under Option A |
| 2-02 | Major | Admin cookie gate blocking internal proxy | New non-admin route `/api/internal/axerve-refund` defined; outside `/admin/:path*` matcher |
| 2-03 | Major | Session auth fail-open | Explicit fail-closed hardening decision added to Constraints/Assumptions |
| 2-04 | Major | Duplicate webhook pipeline | Analysis now uses existing `StripeWebhookEvent` model; no new model created; Caryina wired to `stripeWebhookEventStore.ts` |
| 2-05 | Moderate | Test overclaim | Corrected: tests valid through Phase 1; split required at Phase 2 |
| 2-06 | Moderate | Provider switching scope | Goals narrowed to Caryina-only; CMP explicitly out of scope |
| 2-07 | Moderate | Stale PaymentWebhookEvent reference | Fact-Find Reference updated to reflect existing model reuse |
| 2-08 | Moderate | Phase 2 Stripe-only proxy | Rollout/rollback row updated: unified proxy for all refund types |
| 2-09 | Moderate | Phase 3 s2s auth gap | `/api/internal/shop-config` endpoint defined; `PAYMENT_MANAGER_INTERNAL_TOKEN` added; middleware exemption noted |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| (none) | — | — | All issues from this round resolved before analysis reached Ready-for-planning |

### Critique Score (final round): 4.5 (codemoot 9/10)
Verdict: credible. Proceed to /lp-do-plan.

## Round 3 — 2026-03-13 (plan.md, inline critique — codemoot timed out on large file)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | TASK-11 Security/privacy + Consumer tracing | PM session gate would block Caryina proxy calls to `/api/refunds`; `CARYINA_PM_TOKEN` bearer-token exemption not defined in PM middleware |
| 3-02 | Major | TASK-14 Acceptance/Deliverable | Acceptance said "delete `route.ts`" but TASK-11 converted that file to the production proxy — deleting it would break refund capability permanently |
| 3-03 | Moderate | TASK-02 Engineering Coverage (Data/contracts) | `PAYMENT_MANAGER_ALLOWED_IPS` env var referenced in Edge Cases but absent from wrangler.toml var list and validation contract |
| 3-04 | Moderate | TASK-05 Notes | No mention that Phase 2 proxy calls require PM middleware bearer-token exemption (addressed in TASK-11) |
| 3-05 | Minor | Overall-confidence | 76% is not a valid multiple-of-5 score per plan's own confidence method; should be 75% |
| 3-06 | Minor | TASK-14 dependency | TASK-14 depends on TASK-13 (CMP onboarding) but logically only needs TASK-11 to be stable; coupling creates unnecessary blocker |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Major | PM session gate blocks TASK-11 proxy calls | TASK-11 Engineering Coverage Security row, Consumer tracing, and Scouts updated to require PM middleware bearer-token exemption for `CARYINA_PM_TOKEN` on `/api/refunds`; TC-11-05 added |
| 3-02 | Major | TASK-14 deletes production proxy | TASK-14 Deliverable, Affects, Acceptance criteria, Execution plan, and Planning validation rewritten: proxy (`route.ts`) retained; only standalone admin UI page deleted if it exists |
| 3-03 | Moderate | `PAYMENT_MANAGER_ALLOWED_IPS` undocumented | Added to TASK-02 Engineering Coverage Data/contracts row with deny-all default TC |
| 3-04 | Moderate | Phase 2 auth precondition not noted in TASK-05 | TASK-05 Notes updated to reference TASK-11 bearer-token exemption requirement |
| 3-05 | Minor | 76% invalid score | Corrected to 75% (80% rounded from 79.1% minus 5% downward bias); Overall-confidence Calculation section updated |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 3-06 | Minor | 1 | TASK-14 → TASK-13 dependency couples cleanup to CMP onboarding; acceptable for v1 sequencing (cleanup after all phases validated); low priority |

### Critique Score: 4.0
Verdict: credible. Proceed to Phase 9.5 (Delivery Rehearsal) and Phase 10 (validators + packet + build handoff).
