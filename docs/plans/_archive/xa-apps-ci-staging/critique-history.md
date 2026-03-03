# Critique History: xa-apps-ci-staging

## Round 1 — 2026-02-26

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Critical | Entry Points, Remaining Assumptions, Planning Constraints | CF adapter missing — `next build --webpack` outputs `.next/`, not `.vercel/output/static`. No `@cloudflare/next-on-pages` or `@opennextjs/cloudflare` in xa-b package.json or monorepo. Build chain broken; every deploy task premised on non-existent output dir. |
| 1-02 | Major | Questions / Open → Resolved | Q1 was agent-resolvable deferral. Operator explicitly stated xa-uploader ("uploaded") must be on CF staging. Should have been resolved from original brief. |
| 1-03 | Moderate | Planning Constraints & Notes | wrangler pages deploy command wrong: `--project-name xa-b-site --branch preview` should be `--project-name xa-b-preview` (wrangler.toml `[env.preview]` sets distinct project name). |
| 1-04 | Moderate | Goals, Suggested Task Seeds | Health check strategy undefined for CF Access-gated xa-b — standard 200 check will fail; middleware returns 302/403. |
| 1-05 | Moderate | Suggested Task Seeds (T10) | Catalog seeding absent from operator prerequisites. Empty catalog → empty storefront for user testing. |
| 1-06 | Minor | Questions / Open | Q1 missing explicit decision owner — resolved by fixing 1-02. |

### Issues Confirmed Resolved This Round
*(First critique — no prior issues to resolve.)*

### Issues Carried Open (not yet resolved)
*(First critique — none carried.)*

---

**Round 1 score: 3.0 / 5.0 — partially credible (pre-autofix)**
**Autofix applied: 1 Critical → documented as R0 + T0; 1 Major → resolved; 3 Moderate → fixed. All issues resolved in autofix.**
**Post-autofix estimated score: ~4.0 — credible pending Round 2 confirmation.**

---

## Round 2 — 2026-02-26

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Minor | Constraints & Assumptions | Duplicate constraint line: "xa-drop-worker must be deployed before xa-b builds" appeared twice after Round 1 edit. |
| 2-02 | Minor | Constraints & Assumptions | Stale reference: "flagged in open questions" after Open section was cleared. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Critical | CF adapter missing; build chain broken | R0 added to risk table; T0 added as first task seed; Constraints updated; Q resolved; confidence adjusted |
| 1-02 | Major | Q1 agent-resolvable deferral | Q1 moved to Resolved section with operator-stated evidence |
| 1-03 | Moderate | Wrong wrangler pages deploy command | Fixed to `--project-name xa-b-preview`; deploy model clarified |
| 1-04 | Moderate | Health check undefined for CF Access-gated xa-b | Goal 5 updated; T5 includes 302/403 check guidance |
| 1-05 | Moderate | T10 missing catalog seeding | T9 updated with catalog seeding prerequisite |
| 1-06 | Minor | Q1 missing decision owner | Resolved by fixing 1-02 |

### Issues Carried Open (not yet resolved)
*(None — all Round 1 issues resolved. Round 2 minors fixed in autofix.)*

**Round 2 score: 4.0 / 5.0 — credible**
**Severity distribution: 0 Critical, 0 Major, 0 Moderate, 2 Minor (both autofixed)**
**Verdict: proceed to /lp-do-plan**

---

## Round P-1 (Plan Critique, Round 1) — 2026-02-26

*This is the first critique round on the plan artifact (`plan.md`). Prior rounds (1–2) were on the fact-find artifact.*

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| P1-01 | Critical | TASK-04, TASK-06, Proposed Approach, Summary | Wrong build command: plan specifies `wrangler build` as the OpenNext adapter step. Correct command is `pnpm exec opennextjs-cloudflare build` (confirmed by business-os and caryina in this repo). Using wrong command would produce no `.open-next/` directory. |
| P1-02 | Major | TASK-09 Depends-on, Parallelism Guide | TASK-09 does not depend on TASK-07, but TASK-07 explicitly validates xa-uploader Node.js module compatibility. Without the dependency, TASK-09 could run and deploy before CHECKPOINT clears the Node.js module risk. |
| P1-03 | Moderate | TASK-02 Acceptance criterion | `[[env.preview.r2_buckets]]` specified with `preview_bucket_name` field. In a `[env.preview]` block, `preview_bucket_name` is silently ignored by wrangler deploy; `bucket_name` is required. Staging deploy would fail to bind R2. |
| P1-04 | Moderate | TASK-10 Acceptance criterion | "xa-b CF Pages dashboard env vars" — xa-b is switching to Worker deploy; these env vars are set via `wrangler secret put` or `[env.preview.vars]`, not CF Pages dashboard. |
| P1-05 | Moderate | Proposed Approach, Constraints, Summary, TASK-04 notes | "brikette production uses this pattern" is inaccurate. Brikette CI uses CF Pages static export. The correct Worker deploy precedent is business-os and caryina. |
| P1-06 | Minor | TASK-06 Deliverable | Deliverable listed `next.config.mjs (updated build step)`. xa-uploader has no separate build script; the update goes to `package.json` scripts. |
| P1-07 | Minor | Parallelism Guide Wave 3 | "Stop; run /lp-do-replan on TASK-08" implied replan is unconditional. Fixed to "run /lp-do-replan if assumptions fail." |

### Issues Confirmed Resolved This Round
*(No prior plan-critique issues to resolve — this is Round P-1.)*

### Issues Carried Open (not yet resolved)
*(None — all P1 issues autofixed in this round.)*

---

**Round P-1 pre-autofix score: 3.5 / 5.0 — partially credible**
**Severity distribution: 1 Critical, 1 Major, 3 Moderate, 2 Minor — all autofixed**
**Autofix: 13 point fixes applied across Summary, Constraints, Proposed Approach, TASK-01, TASK-02, TASK-04, TASK-06, TASK-07, TASK-09, TASK-10, Parallelism Guide, Decision Log. Consistency scan: 1 additional cleanup (TASK-09 planning validation stale `wrangler build` reference). All 7 issues resolved.**
**Post-autofix estimated score: 4.5 / 5.0 — credible**
**Verdict: plan is credible; no blocking decisions or open issues remain. Auto-build eligible.**
