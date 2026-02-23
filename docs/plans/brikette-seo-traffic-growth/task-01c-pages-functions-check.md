---
Type: Task-Artifact
Status: Draft
---

# TASK-01c — Pages Functions Preflight Check

Date: 2026-02-22  
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`  
Task ID: `TASK-01c`

## Question

Do Cloudflare Pages Functions exist for Brikette in a way that would shadow `_redirects` and block TASK-01a/TASK-01b?

## Conclusion

**No Functions active in the repo-managed Brikette deployment path; `_redirects` rules should apply as expected.**

No DECISION follow-up is required for shadowing risk.

## Evidence

1. No `functions/` directory exists under Brikette app scope.
   - Command: `find apps/brikette -maxdepth 3 -type d -name functions`
   - Result: `NO_FUNCTIONS_DIR_UNDER_APPS_BRIKETTE`

2. Repository `functions/` paths are in `apps/prime`, not Brikette.
   - Command: `rg --files -g 'functions/**' -g '**/functions/**' apps`
   - Result: matches only `apps/prime/functions/...`

3. Brikette CI/CD deploys static export output (`out`) to Cloudflare Pages.
   - ` .github/workflows/brikette.yml:149` sets `artifact-path: "apps/brikette/out"`
   - ` .github/workflows/brikette.yml:153` deploys with `wrangler pages deploy out` (staging)
   - ` .github/workflows/brikette.yml:185` deploys with `wrangler pages deploy out` (production)
   - ` .github/workflows/brikette.yml:150` comment explicitly states static Pages deploy with no Worker needed

4. Brikette `wrangler.toml` is explicitly marked legacy/non-production.
   - `apps/brikette/wrangler.toml:1-2` says production and staging deploy via Pages.

5. Root redirect is explicitly configured in `_redirects`, which is the surface used by TASK-01b.
   - `apps/brikette/public/_redirects:6` contains `/  /en/  302` (current baseline)

6. Next middleware matcher does not include root `/`; it only handles locale-prefixed paths.
   - `apps/brikette/src/middleware.ts:208` matcher is `/:lang([a-z]{2})/:path*`

## Notes

- `apps/brikette/src/routes/AGENTS.md:41` mentions a Cloudflare Pages Function on `/`, but this file describes a legacy React Router setup and conflicts with the current Next.js + static export deployment pipeline.
- Dashboard-only manual drift (outside git-managed deployment) was not observed in repo evidence. Current conclusion is based on deterministic deploy configuration and repository state.

## Decision Output

Proceed with `TASK-01a` and `TASK-01b` as planned (no Functions shadowing blocker detected).
