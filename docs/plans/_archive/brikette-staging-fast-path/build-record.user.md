# Build Record — Brikette Staging Fast Path

**Plan slug:** brikette-staging-fast-path
**Completed:** 2026-03-08
**Business:** BRIK

## What Was Done

Created `.github/workflows/brikette-staging-fast.yml` — a dedicated fast-path staging
workflow for Brikette that combines build and deploy into a single job.

Key choices made:
- **Single job**: build + deploy in one runner. Eliminates the artifact upload/download
  round-trip that the split-job path in `reusable-app.yml` adds.
- **No CI gates**: lint, typecheck, tests, and all `verify:*` steps (`verify:sitemap-contract`,
  `verify:rendered-link-canonicals`, `verify:localized-commercial-copy`) removed.
- **Preserved**: route hide/restore pattern (required for static export correctness),
  `normalize:localized-routes`, `generate:static-redirects`, and `find out -name "__next.*" -type f -delete`
  (file count safety net).
- **60-minute timeout**: the full-pipeline reusable job timeout was 15 min — too tight for
  a Cloudflare Pages Direct Upload of ~18k files (~37 min upload observed).
- **Triggers**: `push` to `staging` branch (scoped to Brikette + shared package paths)
  and `workflow_dispatch`. Concurrency group `brikette-staging-fast-${{ github.ref }}`
  cancels in-progress runs on new push.
- **Secrets**: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` passed as env vars to
  the deploy step, matching the pattern in `reusable-app.yml`.
- **GA measurement ID**: uses `NEXT_PUBLIC_GA_MEASUREMENT_ID_STAGING` (falling back to
  `NEXT_PUBLIC_GA_MEASUREMENT_ID`) to match staging environment parity with the full path.

The existing `brikette.yml` is untouched. The fast path runs in parallel if both
workflows would trigger (a push to staging now only triggers `brikette-staging-fast.yml`
via path scoping; `brikette.yml` also triggers on staging push but the fast workflow
is now the lower-barrier option for staging-only iterations).

## Validation

- YAML syntax: `python3 -c "import yaml; yaml.safe_load(open(...))"` → `YAML_OK`

## Outcome Contract

- **Why:** Brikette staging deploys took ~57+ min total (20-25 min CI gates + ~37 min
  Cloudflare upload). The fast path removes the CI overhead for staging-only changes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette staging deploys via the fast-path workflow
  complete in roughly the Cloudflare upload time alone (~37 min), with no
  lint/typecheck/test/verify overhead on top.
- **Source:** operator
