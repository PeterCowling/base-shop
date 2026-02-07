---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: CI/Infrastructure
Created: 2026-02-06
Last-updated: 2026-02-07
Feature-Slug: faster-staging-ci
Related-Plan: docs/plans/faster-staging-ci-plan.md
Business-Unit: PLAT
Card-ID:
---

# Faster Staging CI Fact-Find Brief

## Executive Findings
- The current staging deploy loop bottleneck is `Validate & build`, not deploy itself. In recent successful staging runs, `Validate & build` is ~9.1m and `Deploy` is ~2.4m.
- Step-gating only `Lint` + `Typecheck` is unlikely to hit the `<=6m` target by itself. Those steps average ~3.34m; successful staging runs average ~11.7m end-to-end.
- CI reliability issues are currently dominant in telemetry: `Deploy Brikette` staging success is `3/37`; `Merge Gate` success is `0/41`; `Core Platform CI` success is `0/198` in sampled windows.
- Ongoing delivery is still occurring because these failing workflows are not currently enforced on `dev`/`staging` branch protection. Branch protection API returns unprotected for `dev` and `staging`; the active ruleset targets `main` only.
- `Auto PR (dev -> staging)` is currently mostly broken (`76/83` failures), primarily `403 GitHub Actions is not permitted to create or approve pull requests`; this materially affects staging iteration flow and must be classified as prerequisite vs accepted manual workaround.

## Scope
### Summary
Reduce staging feedback time without weakening quality or safety controls. Focus on deploy/config-only changes (especially Brikette staging) while preserving merge safety, local hook controls, and overnight quality signal visibility.

### Goals
- Cut median `Deploy Brikette` runtime on staging deploy loops for deploy-only changes.
- Reduce repeat push cycles caused by deploy/static-export config failures by adding local preflight.
- Preserve existing controls: pre-commit checks, writer lock enforcement, pre-push safety, and conservative CI validation defaults.
- Make the workflow clear enough that agents follow it directly instead of improvising around guardrails.

### Non-goals
- Disabling global quality checks (`Core Platform CI`, merge gate, hook safety checks).
- Replacing GitHub Actions or Turborepo architecture.
- Reworking production deployment flow.
- Repairing all unrelated CI failures in this same implementation stream.

## Definitions
- `Deploy-only change` (draft classifier v0): commit touches only deploy/workflow/config surfaces and no app/runtime code.
- Included examples: `.github/workflows/brikette.yml`, `.github/workflows/reusable-app.yml`, deploy scripts, `apps/brikette/next.config.*`, `apps/brikette/wrangler.toml`.
- Excluded examples: `apps/brikette/src/**`, runtime packages, feature code, content/data code paths.
- `Staging deploy loop`: from first `Deploy Brikette` run for a staging push through the first successful staging run for that loop.
- `Feedback time` metrics used here:
  - Per-run duration: workflow start to finish for one run.
  - Time-to-green: elapsed wall time across retries/cancels until success.
- Conservative default for skip logic: if classification is uncertain, execute full validation path (no skipping).

## Telemetry Methodology
### Capture Window
- Captured on: `2026-02-07` (UTC).
- Data source: GitHub Actions first-party telemetry via `gh` CLI.

### Commands Used
```bash
# Multi-workflow baseline snapshot (fast)
pnpm --filter scripts run collect-workflow-metrics -- \
  --workflow "Deploy Brikette" \
  --workflow "Merge Gate" \
  --workflow "Core Platform CI" \
  --workflow "Package Quality Matrix" \
  --workflow "224568433" \
  --limit 200 \
  --from "2026-01-16T00:00:00Z" \
  --to "2026-02-07T23:59:59Z"

# Targeted job-duration breakdown (slower; one workflow at a time)
pnpm --filter scripts run collect-workflow-metrics -- \
  --workflow "Deploy Brikette" \
  --limit 40 \
  --branch staging \
  --event push \
  --include-jobs \
  --from "2026-02-01T00:00:00Z" \
  --to "2026-02-07T23:59:59Z"
```
For one-off raw checks, `gh run list` remains available, but baseline/post-change reporting should use the script above for consistent segmentation metadata.

### Inclusion / Exclusion Rules
- Outcome counts include all listed runs (`success`, `failure`, `cancelled`, `null` in-progress).
- Duration stats are segmented explicitly:
  - `completed` durations include `success`, `failure`, `cancelled`.
  - `success` durations include `success` only.
- Branch/event segmentation is called out where relevant (especially `staging + push` for Brikette).
- Deploy-only segmentation is an approximation based on commit file paths for staging push run SHAs.

### Limitations
- Recent staging success sample is small (`n=3`), so step-duration estimates are directional.
- Failure-signature counts can overlap per run (one run may match multiple signatures).
- Deploy-only classifier v0 is conservative and path-based, not semantic.

## Repo Audit (Current State)
### Primary Workflow Surfaces
- `.github/workflows/reusable-app.yml` (central reusable deploy pipeline).
- `.github/workflows/brikette.yml` (Brikette caller workflow).
- `.github/workflows/merge-gate.yml` (required-workflow polling/orchestration).
- `.github/workflows/ci.yml` (Core Platform CI).
- `.github/workflows/test.yml` (Package Quality Matrix, includes overnight schedule).
- `.github/workflows/auto-pr.yml` (dev -> staging PR automation).

### Local Guardrails / Hooks
- `scripts/git-hooks/pre-commit.sh` (writer-lock check, staged-scope validation chain).
- `scripts/git-hooks/typecheck-staged.sh` and `scripts/git-hooks/lint-staged-packages.sh` (scoped checks).
- `scripts/git-hooks/pre-push-safety.sh` (blocks protected-branch direct pushes and non-FF pushes).
- `scripts/git-hooks/require-writer-lock.sh` (single-writer lock enforcement).

### Notable Safety Exception
- `reusable-app.yml` keeps `Validate deploy environment` with `continue-on-error: true` (temporary unblock).
- This is a current safety exception and must be tracked as explicit risk with owner/removal criteria in planning.

## Measured Baseline (2026-02-07)
### Deploy Brikette
#### All events/branches (`n=95`, 2026-01-16 -> 2026-02-07)
- Outcomes: `5 success`, `66 failure`, `23 cancelled`, `1 in_progress`.
- Completed duration (`n=94`): p50 `6.1m`, p90 `21.2m`, avg `9.0m`.
- Success-only duration (`n=5`): p50 `11.8m` (heavily skewed by one outlier long success).

#### Staging branch subset (`n=37`, all completed)
- Outcomes: `3 success`, `26 failure`, `8 cancelled`.
- Completed duration: p50 `12.0m`, p90 `18.9m`, avg `11.2m`.
- Success-only duration (`n=3`): p50 `11.75m`, p90 `11.76m`, avg `11.7m`.

#### Staging push subset (`n=33`, all completed)
- Outcomes: `3 success`, `23 failure`, `7 cancelled`.
- Cancellation rate: `21.2%`.

### Deploy-only Segmentation (Draft Classifier v0)
- Population: staging push runs (`n=33`, unique SHAs `n=33`).
- Estimated deploy-only share: `17/33` (`51.5%`).
- Deploy-only outcomes (`n=17`): `1 success`, `13 failure`, `3 cancelled`; p50 `12.7m`, p90 `15.8m`.
- Non-deploy-only outcomes (`n=16`): `2 success`, `10 failure`, `4 cancelled`; p50 `11.7m`, p90 `23.9m`.
- Note: this estimate is path-based and intentionally conservative. It is good enough for planning confidence, not policy enforcement.

### Loop-Level Feedback Time (Time-to-Green)
- Across staging push runs (`n=33`), observed successful loops: `3`.
- Loop 1 (incident-heavy): `31 attempts`, `23 failures`, `7 cancels`, `590.8m` to green.
- Loop 2: `1 attempt`, `11.75m` to green.
- Loop 3: `1 attempt`, `11.77m` to green.
- Interpretation: per-run medians alone mask operator pain during incident periods; loop-level metric must be included in acceptance criteria.

### Step Duration Budget (3 recent successful staging runs)
| Step | Avg Duration |
|---|---:|
| Lint | 1.58m |
| Typecheck | 1.76m |
| Test | 0.00m (skipped in those baseline runs) |
| Build | 3.77m |
| Upload Artifact | 0.39m |
| Download Artifact | 0.22m |
| Deploy command | 1.03m |
| Post-Deploy Health Check | 0.01m |

Inference: skipping only lint+typecheck recovers about `3.34m`; baseline success runtime (`~11.7m`) would still likely land around `~8.3m`, not `<=6m`.

### Merge Gate
- Sample: `n=42` (2026-02-01 -> 2026-02-07).
- Outcomes: `0 success`, `39 failure`, `2 cancelled`, `1 in_progress`.
- Completed duration (`n=41`): p50 `2.3m`, p90 `6.6m`.
- Dominant failure surface remains `Gate :: Wait for required workflows`.

### Core Platform CI
- Sample: `n=200` (2026-01-18 -> 2026-02-07).
- Outcomes: `0 success`, `123 failure`, `75 cancelled`, `2 in_progress`.
- Completed duration (`n=198`): p50 `10.0m`, p90 `19.5m`.

### Auto PR (dev -> staging)
- Sample: `n=83` (2026-01-17 -> 2026-02-07).
- Outcomes: `7 success`, `76 failure`.
- Duration: p50 `0.15m`, p90 `0.20m` (fast-fail pattern).
- Latest failure signature: `403 GitHub Actions is not permitted to create or approve pull requests` while calling `POST /repos/PeterCowling/base-shop/pulls`.

### Package Quality Matrix (including overnight schedule)
- All events sample (`n=160`): `20 success`, `131 failure`, `9 cancelled`.
- Scheduled-only sample (`n=69`): `1 success`, `68 failure`.
- 2026 scheduled subset (`2026-01-01 -> 2026-02-07`, `n=38`): `0 success`, `38 failure`.

## Why 0-Success Workflows Can Coexist With Ongoing Delivery
- `dev` and `staging` branch protection endpoints return `404 Branch not protected`.
- Active repository ruleset targets `refs/heads/main` only.
- Therefore, failing `Merge Gate` / `Core Platform CI` runs in sampled windows do not currently block all staging progression.
- This is not merely a telemetry artifact; it is a governance/configuration state that must be acknowledged in planning.

## Top Failure Signatures (Deploy Brikette staging, latest 20 failures)
Counts below are signature occurrences; one run can contribute to multiple rows.

| Signature | Count | Preventable by Local Preflight? | Notes |
|---|---:|---|---|
| `SOPS_AGE_KEY is required ... not provided` | 13 | Partial | Caught by env preflight; root fix is secret provisioning/policy alignment. |
| Missing `generateStaticParams()` (guides/draft/api manifest routes) | 4 | Yes | Static-export compatibility checks can catch before push. |
| `Failed to collect page data for /robots.txt` | 1 | Yes | Build/static-export preflight should detect. |
| Cloudflare API deploy failures | 4 | No (mostly CI/external) | Needs deploy robustness/retry and infra diagnosis, not local lint/typecheck gating. |
| `wrangler.toml ... missing pages_build_output_dir` warning | 2 | Yes | Config lint/preflight can catch. |
| Generic `exit code 1` wrapper | 20 | No | Wrapper symptom; not a root signature. |

## Guardrails and Risk Posture
- Keep writer-lock and local git safety hooks unchanged (`require-writer-lock`, `pre-push-safety`).
- Keep conservative validation defaults for classifier uncertainty (full path when uncertain).
- Treat `continue-on-error: true` for deploy env validation as temporary exception with explicit retirement plan.

## Sequencing and Dependency Classification
### Classification
- `Auto PR 403` should be treated as a **prerequisite for fully automated dev->staging loop speed gains**.
- Fast staging CI changes can still ship without Auto PR repair, but operational flow remains partially manual and slower.
- Overnight Package Quality Matrix repair should run as a **parallel reliability stream** with explicit visibility; it should not silently invalidate speed metrics interpretation.

### Contract Definition Needed in Plan
- Define trust boundary for `deploy-only` categories.
- Define required checks by category, not by ad hoc workflow exceptions.
- Explicitly decide whether merge-gate requirements differ for deploy-only vs runtime code changes.

## Decision Log (Planning Stub)
| Decision | Owner | Default | Due | Consequence If Deferred |
|---|---|---|---|---|
| Deploy-only trust boundary and file contract | Platform | Conservative path-only v0 | Plan kickoff | Skip logic cannot be safely enforced. |
| Required checks for deploy-only changes | Platform + Repo Governance | Keep existing required checks | Before implementation | Speed gains may be limited or policy-inconsistent. |
| Auto PR 403 handling | Platform + Repo Admin | Treat as prerequisite for automated loop | Immediate | Manual PR steps keep staging cycle slower. |
| `continue-on-error` retirement for deploy env validation | Platform | Remove once secrets path is stable | During implementation | Known safety exception persists. |
| Pre-push scope policy (full vs scoped) | Platform | Keep full pre-push | Plan phase | Local latency remains high, but safety retained. |

## Planning Readiness
- Status: **Ready-for-planning**.
- Conditions to preserve in planning:
  - Keep safety controls unchanged by default.
  - Add explicit telemetry script so baseline/post-change comparisons are reproducible.
  - Use both per-run duration and loop-level time-to-green acceptance metrics.

## Suggested Task Seeds (Non-binding)
- Add a telemetry script (checked in) for baseline and post-change CI metrics.
- Implement deploy-only classifier module with fixture tests and conservative default behavior.
- Add Brikette local deploy preflight for static-export compatibility and deploy-config checks.
- Add explicit step-duration reporting in workflow logs for easier regression analysis.
- Plan and execute Auto PR permission fix (403) as parallel prerequisite stream.
- Create a focused reliability mini-plan for overnight Package Quality Matrix failures.
