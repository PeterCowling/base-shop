---
Status: Complete
Feature-Slug: xa-uploader-deployment-config
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record — XA Uploader Deployment Config

## What Was Built

**TASK-01: Created `apps/xa-uploader/.env.example`**

A new `.env.example` was added to the repo, documenting all environment variables for the
xa-uploader Cloudflare Worker app across seven clearly labelled sections: required secrets
(with `wrangler secret put` instructions and a note that local non-CI production builds
require these in `.env.local` at build time because `next.config.mjs` hard-fails without
them); 2 runtime-required secrets for catalog sync; 1 optional vendor-mode secret; 4
NEXT_PUBLIC vars (with a build-time inlining warning — setting these in wrangler.toml runtime
alone does not update client-bundle values); 14 optional server-tuning vars with defaults; 2
filesystem-only vars explicitly marked not for Cloudflare deployment; and 1 dev/E2E-only
override explicitly marked never-in-production. The file is tracked by git and not gitignored.

**TASK-02: Updated `apps/xa-uploader/wrangler.toml`**

The `wrangler.toml` received a top-level `[vars]` section and a populated `[env.preview.vars]`
section (previously comment-only). Both sections contain all NEXT_PUBLIC and optional server
vars with safe defaults. A required-secrets comment block at the top of the deployment config
area lists all 7 required secrets with their exact `wrangler secret put <VAR>` and
`wrangler secret put <VAR> --env preview` commands. `XA_TRUST_PROXY_IP_HEADERS = "1"` is
set active by default (appropriate for Cloudflare Workers). Filesystem-only and dev/E2E vars
are excluded. Var names and defaults mirror `.env.example` exactly (schema identity enforced
by the sequential task dependency).

## Tests Run

Both tasks are configuration/documentation deliverables (`operator-config-doc`). No
automated tests. Mode 3 Document Review applied to both tasks.

- TASK-01 Mode 3 Document Review: **Pass** (6 TCs verified via shell, Attempt 1)
- TASK-02 Mode 3 Document Review: **Pass** (5 TCs verified via grep + TOML visual inspection, Attempt 1)

## Validation Evidence

**TASK-01:**
- TC-01: `.env.example` exists, tracked by git, not gitignored ✓
- TC-02: All 7 required secrets present with placeholder values; no real credentials ✓
- TC-03: All 4 NEXT_PUBLIC vars present (MODE, MIN_IMAGE_EDGE, R2_DESTINATION, R2_UPLOAD_URL) ✓
- TC-04: Optional server vars present (XA_UPLOADER_MODE, sync timeouts, limits, etc.) ✓
- TC-05: `XA_UPLOADER_PRODUCTS_CSV_PATH` in LOCAL DEV section with explicit "not for wrangler.toml" annotation ✓
- TC-06: `git check-ignore` returned no output for the file ✓

**TASK-02:**
- TC-01: `[vars]` section exists; all 4 NEXT_PUBLIC vars active with empty/"1600" defaults ✓
- TC-02: `[env.preview.vars]` has active `=` assignments (not comment-only) ✓
- TC-03: 9 `wrangler secret put` lines in comment block covering all 7 required secrets + vendor token ✓
- TC-04: No secret-pattern values; only `""`, `"1600"`, `"1"` in [vars] ✓
- TC-05: Valid TOML structure — section headers correct, all key = "value" pairs well-formed ✓

**Cross-check (TASK-02 vs TASK-01):** every NEXT_PUBLIC and optional server var in `.env.example`
appears in `[vars]` with matching default; no extra or missing vars.

## Scope Deviations

None. Both tasks executed within planned scope. `XA_TRUST_PROXY_IP_HEADERS = "1"` was set
active in `wrangler.toml` rather than commented-out: this is correct for a Cloudflare Workers
deployment (documented in `.env.example` as "Safe to enable when deployed on Cloudflare Workers").

## Outcome Contract

- **Why:** xa-uploader is approaching real use but has no documented deployment path — an operator cannot configure it without reading source code
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operator can deploy xa-uploader from scratch by following `.env.example` and `wrangler.toml` comments alone, without reading source code
- **Source:** operator
