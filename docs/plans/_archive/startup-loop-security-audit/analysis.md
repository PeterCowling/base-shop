---
Type: Analysis
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: startup-loop-security-audit
Execution-Track: mixed
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/startup-loop-security-audit/fact-find.md
Related-Plan: docs/plans/startup-loop-security-audit/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Startup Loop: Security Audit Integration — Analysis

## Decision Frame

### Summary

The loop currently sends sites live without any structured security check. The S9B launch QA gate (`/lp-launch-qa`) has 6 domains (conversion, SEO, performance, legal, brand-copy, measurement) but no security domain. CI has dependency audit and secret scanning for core packages but brikette's standalone pipeline excludes both. The decision is **how to add security as a first-class gate** — whether as an extension of `lp-launch-qa`, as a standalone new skill, or purely in CI.

### Goals

- Security baseline verified before any site goes live (OWASP runtime controls, dependency CVEs, secrets, auth hardening, CSP/headers).
- Hard gate at S9B→SIGNALS: critical security failures block advance.
- CI dependency audit and secret scanning on every app-specific deploy pipeline.
- Loop-wide (all businesses, not brikette-only).

### Non-goals

- Penetration testing or manual red-team exercises.
- Rewriting existing auth infrastructure.
- Changing `ci.yml` core security jobs.

### Constraints & Assumptions

- Constraints:
  - S9B is `conditional: false` — security gate must apply to all businesses.
  - Domain module output schema is fixed: `{ domain, status: pass|fail|warn, checks: [{ id, status, evidence }] }`.
  - cmd-advance.md is the authoritative advance loader; loop-spec.yaml is the authoritative stage graph. Both must be updated for a gate to be enforced.
- Assumptions:
  - Runtime HTTP header checks can be performed by the QA subagent using curl against the deployed site URL (available from `latest.user.md`).
  - Pre-existing high/critical CVEs will be remediated as part of this plan before TASK-05 CI changes can pass.

---

## Inherited Outcome Contract

- **Why:** Security audits are required before any site goes live. There is currently no security-audit domain in the S9B launch QA gate, no structured runtime/site-level security checklist in the startup loop, and the CI-level checks that exist are absent from app-specific deploy workflows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Every site progressing through the startup loop to launch is checked against a structured security baseline (OWASP top 10 runtime/headers, dependency CVEs, secrets, auth hardening, cookie security) before it goes live, with a hard gate preventing S9B→SIGNALS advance when critical security failures are present.
- **Source:** operator

---

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-security-audit/fact-find.md`
- Key findings used:
  - `lp-launch-qa` has 6 domain modules with a proven schema; adding a 7th is pattern-following.
  - `modules/cmd-advance.md` is the actual advance loader (not SKILL.md); it requires Module Loading Order and Gate and Dispatch Map entries for GATE-LAUNCH-SEC to be enforced.
  - `ci.yml` excludes `apps/brikette/**` via `paths-ignore` — brikette deploys bypass TruffleHog and pnpm audit.
  - `reusable-app.yml` is the shared pipeline for caryina and future apps; pnpm audit added there covers dependency audit for all callers. TruffleHog must also be added to `reusable-app.yml` — `caryina.yml` supports `workflow_dispatch` which deploys through `reusable-app.yml` without triggering `ci.yml`, leaving a real secret-scanning gap for manual deploys.
  - Self-evolving is `authority_level: shadow`; prescription registration is advisory with no blocking dependency.

---

## Evaluation Criteria

| Criterion | Why it matters | Weight |
|---|---|---|
| Enforcement completeness | Gate must actually block S9B→SIGNALS, not just document a check | High |
| Architectural consistency | New components must follow existing patterns (domain module schema, cmd-advance module pattern) | High |
| Loop-wide coverage | Must apply to all businesses, not just brikette | High |
| CI coverage | Dependency audit and secret scanning must run on every app deploy | High |
| Operator experience | Launch QA report must be unified (one run, all domains including security) | Medium |
| Minimal scope | Avoid creating infrastructure or abstractions beyond what this plan needs | Medium |
| Self-evolving integration | Post-launch security debt should surface as IDEAS items | Low (advisory, shadow mode) |

---

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| **A: Extend lp-launch-qa** | Add `domain-security.md` as 7th domain; add `cmd-advance/s9b-gates.md` for enforcement; extend CI for brikette and reusable pipeline; loop-spec GATE-LAUNCH-SEC annotation. | Consistent with existing architecture; unified QA report; proven pattern; cross-domain synthesis includes security. | Enforcement requires four file changes: new gate module + cmd-advance.md two entries + SKILL.md modules table + SKILL.md version references. | Runtime HTTP checks require curl/tooling available in QA subagent context. | **Yes** |
| **B: Standalone /lp-security-audit skill** | Create a new dedicated skill separate from lp-launch-qa; S9B invokes both skills. | Clean separation; independently versionable. | Fragments the unified domain model; lp-launch-qa's cross-domain synthesis cannot see security signals; duplicates orchestration infrastructure; complicates loop-spec S9B definition. | Double-maintenance burden; go/no-go aggregation splits across two skills. | **No** |
| **C: CI-only gate** | Rely entirely on CI (pnpm audit, TruffleHog, OWASP header check in pipeline) with no lp-launch-qa changes. | No skill changes required. | CI runs before deployment; runtime site-level checks (headers, CSP, cookie flags) require a running site — structurally invalid for a pre-deploy CI check. No operator-facing security report. No loop gate. | Sites launch after CI passes but before runtime security is verified. | **No** |
| **D: Option A without self-evolving (deferred)** | Same as Option A but explicitly defer TASK-06 (self-evolving prescription) to a follow-on gap-fill dispatch. | Tighter scope; no risk from incompletely understood prescription registry. | Self-evolving stays blind to post-launch security debt. | Low — shadow mode means no live impact either way. | **Yes (preferred variant)** |

**Option C** is structurally invalid: CI cannot check headers, CSP, cookie flags, or HTTPS enforcement against a live site — these require an HTTP request to the deployed target. The fact-find confirmed this by tracing the dependency on the deployed site URL from `latest.user.md`.

**Option B** breaks the unified domain model that gives `lp-launch-qa` its coherence (one run → one report → one go/no-go). Cross-domain synthesis (step 3 of the skill) would miss security signals. Loop-spec complexity increases without benefit.

---

## Engineering Coverage Comparison

| Coverage Area | Option A (extend lp-launch-qa) | Option B (standalone skill) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — markdown skill files | N/A — markdown skill files | N/A |
| UX / states | N/A — CLI operator surface | N/A but adds second CLI invocation | N/A |
| Security / privacy | Adds 8 OWASP runtime checks as a domain; hard blocks on critical failures | Adds same checks but decoupled from report synthesis | Domain model: checks + cross-domain synthesis in one pass |
| Logging / observability / audit | Security checks emit into QA report alongside all other domains | Security results in a separate report; must be manually cross-referenced | Unified report; loop-state updated with security verdict |
| Testing / validation | Follows untested domain module convention; live QA run is integration test | Same convention | Integration-tested via live `/lp-launch-qa --domain security` run |
| Data / contracts | Domain output schema unchanged; loop-spec version bump; cmd-advance.md two-entry update | Requires new skill contract, new S9B secondary_skills entry, separate go/no-go logic | Minimal contract surface change; additive only |
| Performance / reliability | N/A — static markdown definitions | N/A | N/A |
| Rollout / rollback | Additive; gate only fires on new/re-run QA; existing loop-state checkpoints unaffected | More complex — two skills to roll back if issues arise | Clean rollback: revert domain-security.md, revert cmd-advance.md entries |

---

## Chosen Approach

**Recommendation: Option D — Option A with self-evolving prescription deferred.**

Deliver TASK-01 through TASK-05 in this plan. Defer TASK-06 (self-evolving prescription registration) to a startup-loop gap-fill dispatch once the prescription registry schema is confirmed.

**Why this wins:**
- Option A is the only architecturally consistent choice: it follows the proven `lp-launch-qa` domain module pattern across 6 existing reference implementations.
- Enforcement is complete: `cmd-advance/s9b-gates.md` (new gate module) + `cmd-advance.md` (Module Loading Order + Gate and Dispatch Map entries) + `startup-loop/SKILL.md` (internal modules table + spec_version references) constitute the full enforcement and contract-sync path identified in the fact-find critique loop.
- Loop-wide coverage: `reusable-app.yml` gets pnpm audit + TruffleHog (covers caryina including manual `workflow_dispatch` runs that bypass `ci.yml`); `brikette.yml` closes the brikette-specific gap (also excluded from `ci.yml`).
- Unified operator experience: one `/lp-launch-qa` run, one report, one go/no-go verdict.
- Self-evolving deferral is correct: shadow mode means no live impact either way, and a partial prescription registration without a confirmed schema adds noise without value.

**What it depends on:**
- Pre-existing high/critical CVEs in pnpm audit must be checked and remediated before TASK-05 can pass CI (TASK-05 has a hard-fail configuration).
- Runtime HTTP checks in domain-security.md depend on curl or equivalent tool availability in the QA subagent execution context (low risk — standard Unix tooling).

### Rejected Approaches

- **Option B (standalone skill)** — rejected: fragments the unified domain model; lp-launch-qa cross-domain synthesis cannot see security signals; doubles orchestration infrastructure with no benefit over extending an existing well-established pattern.
- **Option C (CI-only)** — rejected: structurally invalid for runtime site-level checks; no operator-facing security gate; CI cannot check HTTP headers, CSP, or cookie flags against a live deployed site.
- **TASK-06 in-scope** — deferred: self-evolving is shadow mode; prescription registry schema not fully confirmed; deferral removes uncertainty with no live impact cost.

### Open Questions (Operator Input Required)

None. All blocking questions were resolved in the fact-find. The one advisory question (self-evolving prescription scope) is resolved by deferral.

---

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| **S9B launch QA gate** | 6 domain modules; no security domain; `/lp-launch-qa --domain all` dispatches 6 subagents | Operator runs `/lp-launch-qa --business <BIZ>` after DO completes | 7 domain subagents dispatched in parallel (security added); security subagent checks HTTPS, headers, CSP, cookie flags, repo secrets, auth, CORS; result merged into unified QA report; GATE-LAUNCH-SEC failure = NO-GO | Domain module output schema, go/no-go aggregation, report artifact path, loop-state update | If site URL is unreachable: domain-security.md must set `status: fail` (not warn) — unverified security baseline is a failure. |
| **S9B→SIGNALS advance gate** | No S9B gate family in cmd-advance; SIGNALS advance proceeds without security check | Operator runs `/startup-loop advance --business <BIZ>` from S9B | cmd-advance.md Module Loading Order includes s9b-gates.md for S9B→SIGNALS transition; GATE-LAUNCH-SEC checks for a passing QA report ≤30 days old with security domain `status: pass`; hard-blocks advance if security failed or no recent QA run | All other advance gate families unaffected | QA report age check (30-day window) must be defined in s9b-gates.md; check must be filesystem-only (no external HTTP call at advance time) |
| **CI: brikette deploy pipeline** | No pnpm audit, no TruffleHog in `brikette.yml`; `ci.yml` excludes brikette paths | Push to `dev`, `staging`, or `main` with brikette-scoped changes | `brikette.yml` runs `pnpm audit --audit-level=high` (hard fail) and TruffleHog (`--only-verified`) before the build/deploy jobs; pre-existing CVEs must be remediated before this step passes | Cloudflare Pages build/deploy jobs, health checks, lighthouserc tests | Any existing high/critical CVE in brikette dependencies will block deploys until remediated |
| **CI: shared app pipeline** | No pnpm audit, no TruffleHog in `reusable-app.yml`; caryina and future apps lack both | Push to branches that trigger caryina (or future app) deploys; also `workflow_dispatch` on caryina which bypasses `ci.yml` | `reusable-app.yml` runs `pnpm audit --audit-level=high` AND TruffleHog (`--only-verified`) as pre-deploy jobs; all callers benefit including manual workflow_dispatch runs | Build/deploy jobs, health checks | `--filter` scoping: the audit should cover the specific app's dependencies; TruffleHog checks full git history |
| **Loop-spec stage definition** | S9B has no gate annotation; GATE-LAUNCH-SEC undefined | Loop-spec version bump (3.14.0 → 3.15.0) | S9B stage annotates `GATE-LAUNCH-SEC` (Hard) as the security QA pass condition; ordering constraints unchanged | `[DO, S9B]` and `[S9B, SIGNALS]` ordering unchanged | Stage-operator-map.json derives from `stage-operator-dictionary.yaml` (not `loop-spec.yaml`); map regeneration is a parity check only — no new stage added here. If dictionary is also bumped, regeneration is required; otherwise note the parity gap. |

---

## Planning Handoff

- Planning focus:
  - TASK-01 first: `domain-security.md` defines the check IDs needed by TASK-02 (SKILL.md update) and TASK-03 (loop-spec GATE-LAUNCH-SEC uses the same check-family name).
  - TASK-03 before TASK-04: loop-spec gate ID (`GATE-LAUNCH-SEC`) must be defined before `cmd-advance/s9b-gates.md` references it.
  - TASK-04 requires four file changes: create `cmd-advance/s9b-gates.md`, update `cmd-advance.md` (Module Loading Order + Gate and Dispatch Map), update `startup-loop/SKILL.md` internal modules table (line 52) to register s9b-gates.md, AND update `startup-loop/SKILL.md` hardcoded spec_version references (lines 66 and 98: `3.14.0` → `3.15.0` to match the loop-spec bump in TASK-03). All in same task — these constitute the complete enforcement path.
  - TASK-05 (CI) is independent of TASK-01 through TASK-04; can parallelize.
  - TASK-00 (prerequisite): before TASK-05 can pass in CI, existing high/critical CVEs must be cleared. Plan must include a CVE remediation check before TASK-05 lands.

- Validation implications:
  - domain-security.md: validated via a live `/lp-launch-qa --domain security --business <BIZ>` run against a deployed staging site.
  - cmd-advance/s9b-gates.md: validated via `/startup-loop advance --business <BIZ>` when at S9B — should fail with GATE-LAUNCH-SEC message when no QA report exists, and pass when a recent passing report exists.
  - loop-spec version bump: check whether `stage-operator-dictionary.yaml` spec_version also needs bumping; if so, run regeneration script. If not, the parity gap is a noted advisory — no new stage is added by this plan so map regeneration is not automatically required.
  - CI additions: validated by CI run passing on a push to dev branch.

- Sequencing constraints:
  1. TASK-01: `domain-security.md` (independent start)
  2. TASK-02: `lp-launch-qa/SKILL.md` update (after TASK-01 — needs check IDs)
  3. TASK-03: `loop-spec.yaml` GATE-LAUNCH-SEC annotation + version bump (independent start, can parallel with TASK-01)
  4. TASK-04: create `cmd-advance/s9b-gates.md` + update `cmd-advance.md` (Module Loading Order + Gate and Dispatch Map) + update `startup-loop/SKILL.md` internal modules table AND spec_version references (lines 66, 98: `3.14.0` → `3.15.0`) (after TASK-03)
  5. TASK-05: CI workflow additions — `pnpm audit` + TruffleHog in `brikette.yml`; `pnpm audit` + TruffleHog in `reusable-app.yml` (independent; CVE remediation prerequisite check first)

- Risks to carry into planning:
  - CVE remediation dependency: if high/critical CVEs exist, they block TASK-05. Plan should include a pre-check step.
  - loop-spec version bump parity: `stage-operator-map.json` is generated from `stage-operator-dictionary.yaml` (not `loop-spec.yaml`). No new stage is added, so map regeneration is not automatically required. TASK-03 should include a parity check: if the dictionary spec_version also needs bumping, regenerate; otherwise note the advisory gap.
  - QA report age threshold in s9b-gates.md: 30 days is proposed (consistent with sales funnel audit threshold in GATE-SELL-ACT-01); plan should confirm this is appropriate.

---

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Pre-existing high/critical CVEs block TASK-05 CI | Medium | Medium | Requires `pnpm audit` run to enumerate; not blocking for analysis | Plan must include a pre-build `pnpm audit` check; fix CVEs before TASK-05 lands |
| Runtime HTTP checks require site reachability | Low | Medium | Depends on deployment context; standard curl is available in GitHub Actions | domain-security.md must fail closed when the site URL is not reachable (`status: fail`) — an unreachable site means the security baseline was not verified, which is equivalent to a failure. Degrading to warn would silently bypass the hard gate. |
| stage-operator-map.json parity (VC-02) | Low | Low | Generator reads `stage-operator-dictionary.yaml`, not `loop-spec.yaml`; no new stage added — map regeneration is NOT automatically required by gate annotation alone | TASK-03 should note parity check: if `stage-operator-dictionary.yaml` spec_version field also needs bumping, run regeneration; otherwise skip |
| QA report age window for s9b-gates.md | Low | Low | 30 days is consistent with GATE-SELL-ACT-01 precedent; no operator preference stated | Use 30-day default; note as configurable if needed |

---

## Planning Readiness

- Status: **Go**
- Rationale: Evidence gate passes (fact-find Ready-for-analysis, all evidence evidenced). Option gate passes (3 options compared, 2 rejected with documented rationale). Planning handoff gate passes (sequencing constraints explicit, validation implications documented, no operator-only questions remain). Approach is decisive and implementation is fully specified.
