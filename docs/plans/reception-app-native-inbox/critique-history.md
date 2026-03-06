# Critique History: reception-app-native-inbox

## Round 1 — 2026-03-06

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Confidence Inputs | Confidence inflation — Implementation 86% and Delivery-Readiness 84% despite unresolved hosted OAuth and no D1 precedent in reception |
| 1-02 | Major | Constraints & Assumptions / H3 | Admission gate feasibility unexplored — rule-based vs LLM-assisted mechanism not addressed |
| 1-03 | Major | Evidence Audit / Constraints | Hosted Gmail OAuth pattern gets one bullet point despite being the hardest technical decision |
| 1-04 | Moderate | Constraints & Assumptions | D1 assumed without reception precedent — reception uses Firebase RTDB, not D1 |
| 1-05 | Moderate | Constraints | Email volume time unit missing — "below 100 messages" with no per-day/week/month qualifier |
| 1-06 | Moderate | Frontmatter | Non-schema field `Trigger-Source`; missing `Trigger-Why`/`Trigger-Intended-Outcome` |
| 1-07 | Minor | Hypothesis table | H2/H3 falsification costs vague ("Medium" with no concrete grounding) |

### Issues Confirmed Resolved This Round
(none — first round)

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-03 | Major | 1 | Hosted Gmail OAuth pattern needs exploration of options (KV tokens, service account, relay) |

## Round 2 — 2026-03-06

### Issues Opened This Round
(none)

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | Confidence inflation — Implementation 86% and Delivery-Readiness 84% despite unresolved hosted OAuth and no D1 precedent in reception | Confidence narrative now states hosted OAuth/token refresh and reception-local D1 adoption as explicit unknowns; Delivery-Readiness remains conservative at 70% and Implementation at 72% |
| 1-02 | Major | Admission gate feasibility unexplored — rule-based vs LLM-assisted mechanism not addressed | Fact-find now anchors v1 admission on the existing deterministic classifier in `packages/mcp-server/src/tools/gmail-classify.ts`, adds contract mapping for admit/archive/review-later, and replaces the open-ended LLM fork with a concrete baseline |
| 1-03 | Major | Hosted Gmail OAuth pattern gets one bullet point despite being the hardest technical decision | Fact-find now documents explicit hosted adapter options, rejects the local `credentials.json` / `token.json` path, marks the Worker-safe auth design as the first required spike, and adds a stop condition if that spike fails |
| 1-04 | Moderate | D1 assumed without reception precedent — reception uses Firebase RTDB, not D1 | Fact-find now cites repo D1 precedent in `apps/business-os/src/lib/d1.server.ts` and `packages/platform-core/src/d1/getBindings.server.ts` while still stating that reception-local adoption is new infrastructure |
| 1-05 | Moderate | Email volume time unit missing — "below 100 messages" with no per-day/week/month qualifier | Constraint now states "below 100 messages per month during the open season" |
| 1-06 | Moderate | Non-schema field `Trigger-Source`; missing `Trigger-Why`/`Trigger-Intended-Outcome` | Non-schema `Trigger-Source` remains removed and the frontmatter now includes `Last-reviewed` and `Relates-to`, bringing the metadata closer to current fact-find conventions |
| 1-07 | Minor | H2/H3 falsification costs vague ("Medium" with no concrete grounding) | H3 is now tied to deterministic classifier replay/fixture validation, and the recommended validation approach specifies labeled-sample replay plus route/service contract tests |

### Issues Carried Open (not yet resolved)
(none)

## Round 3 — 2026-03-06 (plan critique, codemoot Round 1)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Critical | TASK-01 | Gmail OAuth spike only stores refresh_token but needs client_id + client_secret too |
| 3-02 | Major | TASK-02 | getCloudflareContext() sync vs async variant not resolved for reception runtime |
| 3-03 | Major | TASK-07 | UI targets non-existent `(protected)` route group — reception uses App wrapper + modal nav |
| 3-04 | Major | TASK-08 | Fire-and-forget logging conflicts with audit guarantee acceptance criterion |

### Issues Confirmed Resolved This Round
(none — first plan critique round)

### Issues Carried Open (not yet resolved)
(none — all fixed in autofix)

## Round 4 — 2026-03-06 (plan critique, codemoot Round 2)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 4-01 | Major | Goals / TASK-02 | D1 described as canonical for all state but only stores metadata — Gmail is canonical for message content |
| 4-02 | Major | TASK-06 | Resolve route added to acceptance but missing from Affects, execution plan, and validation contract |
| 4-03 | Major | TASK-07 | OperationsModal integration path still inaccurate — needs actual page route target + nav entry |
| 4-04 | Minor | TASK-07 | Execution plan still says "page routes" after page files were removed |
| 4-05 | Minor | TASK-07 | Notes still reference stale `(protected)/` path |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Critical | Gmail OAuth spike missing client_id + client_secret | Added all three secrets (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) to TASK-01 |
| 3-02 | Major | getCloudflareContext() runtime mismatch | Added note in TASK-02 to verify sync vs async variant during build |
| 3-03 | Major | UI targets non-existent route group | Corrected to modal-based nav + page route pattern |
| 3-04 | Major | Fire-and-forget vs audit conflict | Split into write-through (audit-critical) and best-effort (non-critical) events |

### Issues Carried Open (not yet resolved)
(none — all fixed in autofix)

## Round 5 — 2026-03-06 (plan critique, codex Round 3)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 5-01 | Major | TASK-09 | Draft pipeline task falsely treated MCP generate/quality stages as pure/no-I/O, understating the extraction scope |
| 5-02 | Major | TASK-09 | Template/resource scope was wrong: plan cited 18 templates, but source data has 180 and still depends on local resource loaders |
| 5-03 | Major | TASK-06 | Regenerate endpoint existed in acceptance/VCs but not in `Affects` or execution plan as a distinct route |
| 5-04 | Moderate | TASK-05 | Incremental sync checkpoint was hand-wavy (`historyId or timestamp`) despite the plan depending on Gmail history semantics |
| 5-05 | Moderate | Plan Gates / Overall-confidence | Gate metadata was stale: it still referenced Round 2 and the pre-rewrite confidence calculation |

### Issues Confirmed Resolved This Round
(none — no prior-round issues were carried into this critique)

### Issues Carried Open (not yet resolved)
(none — all fixed in autofix)
