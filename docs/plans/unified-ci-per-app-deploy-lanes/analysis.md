---
Type: Analysis
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: unified-ci-per-app-deploy-lanes
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/unified-ci-per-app-deploy-lanes/fact-find.md
Related-Plan: docs/plans/unified-ci-per-app-deploy-lanes/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Unified CI Validation and Per-App Deploy Lanes Analysis

## Decision Frame
### Summary
Choose the simplest architecture for splitting validation (lint/typecheck/test) from deployment across all apps. The operator wants one mental model: ci.yml validates changed code on dev/PR, per-app workflows deploy on staging/main, nothing else. The prior Brikette-only attempt introduced duplication instead of removing it; this analysis covers all apps.

### Goals
- ci.yml is the sole validation workflow for all apps on dev/PR.
- Per-app deploy workflows are thin: detect changes, build, deploy. No lint/typecheck/test.
- "Nothing changed, nothing to do" at both layers.
- Remove workflow_dispatch from app workflows (accounting for auto-pr.yml dependency).
- Add staging deploy to apps that lack it.

### Non-goals
- Redesign app code, static-export architecture, or Cloudflare project structure.
- Change the dev → staging → main branch promotion policy.
- Modify non-app workflows (storybook, consent-analytics, lighthouse, cypress).

### Constraints & Assumptions
- Constraints:
  - merge-gate.yml watches specific workflow file IDs — must be updated atomically.
  - auto-pr.yml dispatches brikette.yml by workflow_id — must be accounted for.
  - Per-app deploy secrets, health checks, and build quirks (route-hide/restore, SOPS decrypt) must be preserved.
  - Worker apps (caryina, reception, business-os) lack staging wrangler config — adding staging deploy requires wrangler config changes.
- Assumptions:
  - turbo --affected covers all app workspaces for lint/typecheck/test.
  - ci.yml governance jobs (security audit, secret scanning, dep alignment, license check, docs lint, token validation) are repo-level checks that should run on all pushes.

## Inherited Outcome Contract
- **Why:** The current CI setup is fragmented: validation is duplicated across ci.yml, reusable-app.yml, and per-app workflows. The operator wants the simplest possible model.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All apps share one validation workflow (ci.yml) on dev/PR and thin per-app deploy workflows on staging/main, with no validation duplication, no workflow_dispatch, and path-gated skip-if-unchanged semantics.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/unified-ci-per-app-deploy-lanes/fact-find.md`
- Key findings used:
  - ci.yml already runs turbo lint/typecheck/test --affected — correct foundation.
  - Every app with a deploy workflow duplicates validation (via reusable-app.yml or standalone).
  - ci.yml paths-ignore excludes brikette/skylar/cms, forcing those apps to duplicate validation.
  - merge-gate.yml and auto-pr.yml are the two consumers of workflow file IDs.
  - Worker apps (caryina, reception, business-os) wrangler.toml files lack staging/preview config.
  - reusable-app.yml is 845 lines carrying app-specific logic (brikette classifier, prime lint gate, reception firebase rules).

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Simplicity | Operator's explicit top priority — "simplest, most straightforward" | Critical |
| No validation duplication | Core problem being solved | Critical |
| Minimal merge-gate disruption | merge-gate is the PR gating mechanism — breakage blocks all merges | High |
| Preserved deploy correctness | Build quirks, secrets, health checks must survive | High |
| CI minute efficiency | Governance jobs running unnecessarily wastes minutes | Medium |
| File count / maintenance burden | Fewer files to maintain, less sync burden | Medium |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Remove paths-ignore + thin per-app deploy | Remove ci.yml paths-ignore entirely. ci.yml validates all pushes. Per-app workflows become deploy-only on staging/main. | Simplest config. No validation duplication. No paths-ignore sync burden. One mental model. | Governance jobs (security audit, secret scanning, dep alignment, license, docs lint, token validation) run on every push including pure app-only changes. ~6-8 extra jobs per push. | CI minutes increase modestly for pure app-only changes. | Yes |
| B: Keep paths-ignore + thin per-app deploy | Keep ci.yml paths-ignore for apps with deploy workflows. Per-app deploy workflows are deploy-only. | Saves governance job runs on pure app-only pushes. | Must maintain paths-ignore in sync with app dependency trees. Pure app-only changes get NO governance checks (security audit, license, etc.) — a real coverage gap. If a brikette-only change introduces a license-incompatible dependency, it's missed. | Governance coverage gap for excluded apps. paths-ignore sync burden remains. | Yes but weaker |
| C: Reusable deploy workflow | Replace reusable-app.yml with a thin reusable-deploy.yml. Per-app callers pass build/deploy commands. | Reduces per-app file size. Shared deploy logic in one place. | Adds indirection. Build quirks (route-hide, SOPS decrypt, OpenNext) vary so much per app that the reusable workflow becomes a kitchen sink again. | Recreates the reusable-app.yml complexity problem in a different form. | Yes but defeats the simplicity goal |

## Engineering Coverage Comparison
| Coverage Area | Option A (remove paths-ignore) | Option B (keep paths-ignore) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A | N/A | N/A — no product UI changes |
| UX / states | Clear two-layer model: ci.yml validates, per-app deploys | Same two-layer model but with paths-ignore sync burden | Option A is simpler mental model |
| Security / privacy | All pushes get security audit, secret scanning, license checks. workflow_dispatch removed (with auto-pr.yml exception). | Pure app-only pushes skip security audit/license checks — a governance gap. | Option A has better security coverage |
| Logging / observability / audit | One validation workflow + one deploy workflow per app. Clear audit trail. | Same structure but paths-ignore can cause confusion about why ci.yml didn't run for a commit. | Option A clearer |
| Testing / validation | turbo --affected handles all validation scoping. App-specific gates (prime firebase, reception firebase rules) move to ci.yml as conditional steps. | Same validation approach but paths-ignore means some pushes never trigger ci.yml at all. | Option A — ci.yml is truly universal |
| Data / contracts | merge-gate scopeWorkflowMap + auto-pr.yml dispatch updated. filter-config.ts paths-ignore entries removed. | merge-gate updated. filter-config.ts paths-ignore maintained. | Option A removes sync burden |
| Performance / reliability | ~6-8 governance jobs run on every push (~5-10 min overhead for pure app-only changes). turbo --affected keeps validation scoped. | Pure app-only pushes skip governance jobs. Shared package pushes trigger both ci.yml and deploy workflows. | Option A trades modest CI minutes for simplicity |
| Rollout / rollback | Phased: update ci.yml + one app, verify, extend. Rollback via git revert. | Same rollout approach. | Same rollout shape |

## Chosen Approach
- **Recommendation:** Option A — Remove ci.yml paths-ignore entirely. ci.yml validates all pushes via turbo --affected. Per-app workflows become deploy-only on staging/main.
- **Why this wins:**
  - Simplest configuration. The operator explicitly prioritized simplicity.
  - Eliminates the paths-ignore sync burden — no need to maintain path lists that must match app dependency trees.
  - No governance coverage gap — all pushes get security audit, license checks, etc.
  - One mental model: ci.yml validates everything, per-app workflows only deploy.
  - The CI minute cost (~5-10 min of governance jobs on pure app-only pushes) is acceptable — these jobs are fast and provide real value.
- **What it depends on:**
  - turbo --affected correctly scopes lint/typecheck/test to changed workspaces (already verified).
  - merge-gate and auto-pr.yml updated atomically with workflow changes.
  - App-specific validation gates (prime firebase cost gate, reception firebase rules test) moved to ci.yml.

### Rejected Approaches
- **Option B (keep paths-ignore)** — Rejected because it creates a governance coverage gap for excluded apps (security audit, license checks don't run on pure app-only changes) and perpetuates the paths-ignore sync burden that caused the original fragmentation.
- **Option C (reusable deploy workflow)** — Rejected because per-app build quirks (route-hide/restore, SOPS decrypt, OpenNext, preflight scripts, language subsets) vary so much that a reusable workflow becomes a kitchen sink — recreating the reusable-app.yml problem. Thin per-app files are simpler despite more files.

### Open Questions (Operator Input Required)
None. All approach forks resolved from documented requirements and engineering evidence.

## Planning Handoff
- Planning focus:
  - Phase 1: Remove ci.yml paths-ignore + move app-specific validation gates into ci.yml + remove brikette.yml validation job.
  - Phase 2: Convert each per-app workflow to deploy-only (staging + main, path-gated, merge-only).
  - Phase 3: Update merge-gate scopeWorkflowMap and auto-pr.yml. Remove/archive reusable-app.yml.
  - Phase 4: Add staging deploy for Worker apps (caryina, reception, business-os) — may require wrangler config changes first.
- Validation implications:
  - actionlint on all modified workflow files.
  - merge-gate scopeWorkflowMap must reference correct workflow file IDs.
  - Verify auto-pr.yml dispatch compatibility.
  - CI run on dev to confirm turbo --affected covers all apps after paths-ignore removal.
- Sequencing constraints:
  - ci.yml paths-ignore removal must happen before or atomically with per-app workflow simplification — otherwise removing per-app validation creates a gap.
  - merge-gate + auto-pr.yml update must be atomic with workflow file identity changes.
  - Worker app staging deploy (Phase 4) can be deferred if wrangler config changes are complex — it's additive, not blocking.
- Risks to carry into planning:
  - CMS test duration without 4-shard parallelism may be long — monitor and re-add sharding as a ci.yml conditional job if needed.
  - auto-pr.yml brikette dispatch may be redundant (brikette.yml triggers on dev push anyway) — verify and potentially remove the dispatch.
  - XA apps (3 apps in 1 workflow) may need special handling — either keep as one deploy workflow or split into 3.

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| CMS test duration increases without 4-shard parallelism | Medium | Medium | Requires CI measurement after change | Plan should include monitoring step; re-add sharding as conditional ci.yml job if >30min |
| auto-pr.yml dispatch breaks if brikette.yml changes identity | Low | High | auto-pr.yml uses `brikette.yml` by name | Keep brikette.yml file identity stable; update auto-pr.yml dispatch if needed |
| Worker app staging deploy requires wrangler config authoring | Medium | Medium | Config changes are outside workflow scope | Plan should separate wrangler config as a prerequisite task; defer staging deploy for Worker apps if complex |
| Governance jobs add ~5-10 min to pure app-only pushes | Low | Low | Accepted trade-off for simplicity | Monitor CI duration; re-add targeted paths-ignore only if costs become material |
| XA apps (3 in 1 workflow) need deploy-only conversion | Low | Medium | xa.yml structure differs from single-app workflows | Plan may keep xa.yml as one deploy workflow for 3 apps |

## Planning Readiness
- Status: Go
- Rationale: Approach is decisive (Option A). All gates pass. No open operator questions. Engineering coverage implications documented. Sequencing constraints and risks identified for planning to consume.

## Analysis Gates
- Evidence Gate: Pass — fact-find exists at Ready-for-analysis with complete engineering coverage matrix and outcome contract.
- Option Gate: Pass — 3 options compared explicitly with rejection rationale.
- Planning Handoff Gate: Pass — chosen approach decisive, rejected options documented, planning handoff notes present, engineering coverage carried forward, no open questions.
