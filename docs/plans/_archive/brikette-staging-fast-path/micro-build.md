---
Type: Micro-Build
Status: Archived
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: brikette-staging-fast-path
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260308150000-4471
Related-Plan: none
---

# Brikette Staging Fast Path Micro-Build

## Scope
- Change: Create `.github/workflows/brikette-staging-fast.yml` — a dedicated fast-path
  staging workflow that combines build + deploy in a single job, skips all CI validation
  gates (lint, typecheck, tests, verify:* steps, post-deploy health checks), raises
  timeout to 60 min, and eliminates artifact upload/download overhead.
- Non-goals: change production deploy path; change the existing brikette.yml; migrate
  to a Git-integrated Pages project; reduce the Cloudflare Direct Upload time itself.

## Execution Contract
- Affects: `.github/workflows/brikette-staging-fast.yml` (new file)
- Acceptance checks:
  1. Workflow file parses as valid GitHub Actions YAML (no syntax errors).
  2. Triggered by `push` to `staging` branch and `workflow_dispatch`.
  3. Single job — no artifact upload/download steps.
  4. Build command omits all `verify:*` steps.
  5. Deploy targets `--branch staging` on the `brikette-website` Pages project.
  6. Job timeout is 60 minutes.
  7. `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are passed as env vars to the
     deploy step.
  8. Route hide/restore pattern preserved (required for static export correctness).
  9. `find out -name "__next.*" -type f -delete` preserved (file count safety).
- Validation commands:
  - `python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/brikette-staging-fast.yml'))" && echo YAML_OK`
- Rollback note: delete the new file; existing brikette.yml is untouched throughout.

## Outcome Contract
- **Why:** Brikette staging deploys currently take ~57+ min total (CI gates ~20-25 min + Cloudflare upload ~37 min). The fast path removes the CI overhead for staging-only changes where correctness gates are not needed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette staging deploys via the fast-path workflow complete in roughly the Cloudflare upload time alone (~37 min), with no lint/typecheck/test/verify overhead on top.
- **Source:** operator
