---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28 (TASK-02 complete — all tasks done)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-deployment-config
Deliverable-Type: operator-config-doc
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Deployment Config Plan

## Summary

`apps/xa-uploader` has no `.env.example` and an empty `[env.preview.vars]` in `wrangler.toml`.
An operator deploying or managing this Cloudflare Worker app for the first time has no documented
list of required or optional environment variables, their formats, or defaults — making deployment
a guessing exercise requiring source-code archaeology.

This plan delivers two artifacts: a fully annotated `.env.example` and an updated `wrangler.toml`
with populated `[vars]` and `[env.preview.vars]` sections. Together they give an operator a
complete documented path to deploy from scratch without reading source code. Both tasks are S
effort. TASK-01 runs first; TASK-02 runs after and mirrors its var list to prevent schema drift.

## Active tasks
- [x] TASK-01: Create `apps/xa-uploader/.env.example`
- [x] TASK-02: Update `apps/xa-uploader/wrangler.toml` with [vars] sections

## Goals
- Create `apps/xa-uploader/.env.example` documenting all env vars (required vs optional, format, default, secrets use placeholder values only)
- Populate `wrangler.toml` top-level `[vars]` and `[env.preview.vars]` with NEXT_PUBLIC and optional server vars
- Add deployment instructions as comments in `wrangler.toml` listing required secrets and `wrangler secret put` commands
- Enable operator to deploy xa-uploader to a fresh Cloudflare account using only these two files as a guide

## Non-goals
- Changing any application logic or env var behaviour
- Setting up secrets in Cloudflare dashboard (manual operator step, not automated)
- Documenting CI-only secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) — these are GitHub Actions secrets documented separately
- Setting actual R2 values (R2 bucket URL and upload URL are deployment-specific; left empty = feature disabled by default)

## Constraints & Assumptions
- Constraints:
  - All 7 required secrets must NEVER appear in committed files — only as placeholder strings in `.env.example`
  - `.env.example` must be committed to the repo (not gitignored)
  - `wrangler.toml` `[vars]` is for non-secret, per-deployment configuration only
  - `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL` is the R2 feature enablement toggle — empty = disabled
  - Filesystem-only vars (`XA_UPLOADER_PRODUCTS_CSV_PATH`, `XA_UPLOADER_NEXT_DIST_DIR`) must NOT be added to `wrangler.toml [vars]`
  - **Build-time secret requirement:** For local non-CI production builds (`NODE_ENV=production`, `CI` env var unset), the 5 secrets enforced by `next.config.mjs:33-38` (`XA_UPLOADER_SESSION_SECRET`, `XA_UPLOADER_ADMIN_TOKEN`, `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`) must be present in the build environment (e.g. `.env.local`) — `next.config.mjs` hard-fails the build if they are missing. CI builds skip this check automatically when the `CI` environment variable is set (GitHub Actions sets `CI=true` automatically). `.env.example` must document this local-build requirement alongside the runtime `wrangler secret put` requirement.
  - **NEXT_PUBLIC build-time inlining:** `NEXT_PUBLIC_*` vars are inlined into client bundles at build time by Next.js. Setting them in `wrangler.toml [vars]` makes them available to server-side Worker runtime code but does NOT update client-visible values without a rebuild. `.env.example` and `wrangler.toml` must include a comment explaining that for client-side behavior changes, these vars must be set in the build environment before running `opennextjs-cloudflare build`.
- Assumptions:
  - Current `.env.local` values are for local dev only; `wrangler secret put` is the production runtime path; for local production builds, `.env.local` must also contain the required secrets
  - `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET` are required at CF build time (enforced by `next.config.mjs:34-36`) but auto-generated randomly in non-production — document them as required CF secrets, note they are auto-generated locally
  - Empty-string defaults in `[vars]` are safe for NEXT_PUBLIC vars (features degrade gracefully); actual client-side behavior changes require providing these vars during the build step

## Inherited Outcome Contract

- **Why:** xa-uploader is approaching real use but has no documented deployment path — an operator cannot configure it without reading source code
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operator can deploy xa-uploader from scratch by following `.env.example` and `wrangler.toml` comments alone, without reading source code
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-deployment-config/fact-find.md`
- Key findings used:
  - 7 required production secrets: 5 enforced at build time by `next.config.mjs:33-44` (`XA_UPLOADER_SESSION_SECRET`, `XA_UPLOADER_ADMIN_TOKEN`, `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`); 2 required at sync-time (`XA_CATALOG_CONTRACT_BASE_URL`, `XA_CATALOG_CONTRACT_WRITE_TOKEN`)
  - `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL` (not `R2_DESTINATION`) is the enablement toggle — `""` = disabled
  - `NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION` is display text only — defaults to a UI placeholder string in code
  - Filesystem vars (`XA_UPLOADER_PRODUCTS_CSV_PATH`, `XA_UPLOADER_NEXT_DIST_DIR`) are not for wrangler.toml
  - `[env.preview.vars]` is currently empty (comment-only); no top-level `[vars]` section exists

## Proposed Approach

- Option A: Create `.env.example` + update `wrangler.toml` as two parallel S-effort tasks.
- Option B: Single task combining both files.

- Chosen approach: Option A — separate tasks for separate concerns. `.env.example` is a developer reference document (broad audience); `wrangler.toml [vars]` is a deployment configuration file. Keeping them separate makes scope clear, allows parallel execution, and makes review easier. No decision input required.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `apps/xa-uploader/.env.example` with all vars documented | 90% | S | Complete (2026-02-28) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Update `wrangler.toml` [vars] and [env.preview.vars] | 85% | S | Complete (2026-02-28) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Creates `.env.example` with canonical var list and defaults |
| 2 | TASK-02 | TASK-01 | Mirrors var names/defaults from `.env.example` into `wrangler.toml`; sequential ensures schema identity |

## Tasks

### TASK-01: Create `apps/xa-uploader/.env.example`
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-uploader/.env.example` (new file committed to repo)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/xa-uploader/.env.example`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — exact content fully determined from source investigation; complete var inventory confirmed via grep + source reads across all relevant modules
  - Approach: 95% — `.env.example` format is standard; single correct approach with no alternatives
  - Impact: 90% — directly enables operator deployment; one open question (R2 deployment values) has a safe empty-string default that does not block delivery
- **Acceptance:**
  - `.env.example` exists at `apps/xa-uploader/.env.example` and is tracked by git
  - All 7 required secrets listed with placeholder values (e.g. `your-session-secret-min-32-chars`) and `wrangler secret put` instructions
  - All 4 NEXT_PUBLIC vars listed with correct defaults (`""` for R2 vars, `"1600"` for min edge)
  - All optional server vars listed with defaults
  - No real secret values in the file (verified by inspection)
  - Local-only vars clearly marked as `.env.local` only, not for CF deployment
- **Validation contract:**
  - TC-01: `apps/xa-uploader/.env.example` exists → `ls apps/xa-uploader/.env.example` succeeds
  - TC-02: All 7 required secrets present with placeholder values → grep for each var name confirms presence; grep for hex/random strings returns no matches
  - TC-03: All NEXT_PUBLIC vars present: `NEXT_PUBLIC_XA_UPLOADER_MODE`, `NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE`, `NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION`, `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL` → grep confirms
  - TC-04: Optional server vars present with defaults (e.g. `XA_UPLOADER_MODE`, `XA_UPLOADER_SYNC_TIMEOUT_MS`) → grep confirms
  - TC-05: `XA_UPLOADER_PRODUCTS_CSV_PATH` marked as `.env.local` only (not wrangler.toml) → present with clear annotation
  - TC-06: File is not gitignored → `git check-ignore apps/xa-uploader/.env.example` returns no output
- **Execution plan:**
  - Red: Confirm `.env.example` does not yet exist (file read fails) — expected precondition
  - Green: Create `apps/xa-uploader/.env.example` with all vars organized in sections: (1) Required secrets — `wrangler secret put`, (2) Optional secrets, (3) NEXT_PUBLIC vars — wrangler.toml `[vars]`, (4) Optional server vars — wrangler.toml `[vars]`, (5) Local dev / filesystem-only — `.env.local` only, (6) Dev/E2E only — never in production
  - Refactor: Review for accuracy against fact-find inventory; ensure no real values; add header comment explaining usage distinction between `wrangler secret put` and `[vars]`
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** None: full inventory confirmed from source; no unknowns requiring probes
- **Edge Cases & Hardening:**
  - If a contributor accidentally removes placeholder comment and replaces with real value: mitigated by clear header comment and git review process
  - `NEXTAUTH_SECRET`/`SESSION_SECRET`/`CART_COOKIE_SECRET` may confuse contributors who associate these with NextAuth.js — add inline comment explaining: (a) they are enforced by the shared Next.js platform config at build time, (b) in local dev (non-production) they are auto-generated randomly so `.env.local` is not required, but (c) for local production builds or CF deployment, they must be set explicitly in `.env.local` (build) and `wrangler secret put` (runtime)
  - Local non-CI production builds: if operator runs `opennextjs-cloudflare build` locally without CI flag, the build hard-fails without required secrets — `.env.example` must include a comment that for local production builds, secrets must be present in `.env.local` at build time (in addition to `wrangler secret put` for runtime)
  - `NEXT_PUBLIC_*` vars are build-time inlined: `.env.example` must include a comment explaining that to change client-visible behavior for NEXT_PUBLIC vars, these vars must be present in the build environment at build time — setting them only in Cloudflare dashboard or wrangler.toml [vars] after deploy will NOT update client-rendered values without a new build
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% if R2 deployment values (bucket path + upload URL) were provided by operator — but the safe empty-string default means this is not needed for delivery
- **Rollout / rollback:**
  - Rollout: Single file creation; add to git commit
  - Rollback: Delete file if incorrect (no application behaviour affected)
- **Documentation impact:**
  - This IS the documentation deliverable; no additional docs required
- **Notes / references:**
  - Shared platform vars (`CMS_SPACE_URL`, `CMS_ACCESS_TOKEN`, `SANITY_API_VERSION`, `EMAIL_PROVIDER`) set to safe defaults in `next.config.mjs:47-50` — intentionally omitted from `.env.example` (not xa-uploader-specific)
  - `XA_UPLOADER_E2E_ADMIN_TOKEN` is dev/test-only; include in a clearly marked "Dev/E2E only" section with explicit note that it must never be set in production

**Build Evidence (2026-02-28):**
- Execution route: inline (Codex exec flags incompatible with current codex version — fell back inline per protocol)
- Red phase: confirmed `apps/xa-uploader/.env.example` did not exist prior to task
- Green phase: created file with 7 sections (required secrets, optional secrets, NEXT_PUBLIC, optional server vars, local-only, dev/E2E)
- Refactor phase: all 6 TCs passed via shell verification
- Post-build validation: Mode 3 (Document Review) — Attempt 1 — **Pass**. All sections present, all `wrangler secret put` commands syntactically correct, NEXT_PUBLIC build-time inlining note prominent, no broken references, no real secret values, file not gitignored.

---

### TASK-02: Update `apps/xa-uploader/wrangler.toml` with [vars] sections
- **Type:** IMPLEMENT
- **Deliverable:** updated `apps/xa-uploader/wrangler.toml` with populated `[vars]` and `[env.preview.vars]`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/xa-uploader/wrangler.toml`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 95% — exact wrangler.toml structure confirmed; which vars belong in [vars] vs secrets determined from source investigation
  - Approach: 90% — `[vars]` for non-secrets, `wrangler secret put` for secrets is the single correct Cloudflare pattern; well-documented
  - Impact: 85% — directly improves deployment discoverability; NEXT_PUBLIC vars in [vars] serve server-side runtime and documentation purposes; client-side behavior changes require vars in the build environment at build time (documented via comment)
- **Acceptance:**
  - Top-level `[vars]` section added above `[env.preview]` with NEXT_PUBLIC vars and optional server tuning vars, all with safe defaults
  - `[env.preview.vars]` populated with same vars
  - Comment block in `wrangler.toml` listing required secrets with the exact `wrangler secret put <VAR> --env preview` commands
  - No secret values in `wrangler.toml` (only empty strings or public defaults)
  - File remains valid TOML
- **Validation contract:**
  - TC-01: `[vars]` section exists with `NEXT_PUBLIC_XA_UPLOADER_MODE`, `NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE`, `NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION`, `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL` → grep `\[vars\]` in wrangler.toml returns match; grep for each var name confirms presence
  - TC-02: `[env.preview.vars]` populated (not comment-only) → grep confirms at least one `=` assignment after the `[env.preview.vars]` heading
  - TC-03: Comment block listing required secrets with `wrangler secret put` command examples → grep for `wrangler secret put` returns multiple matches
  - TC-04: No secret-pattern values in [vars] (no strings matching min-32-char pattern, no credentials) → visual inspection passes
  - TC-05: `wrangler.toml` is syntactically valid — verified by CI deploy step (wrangler exits non-zero with a TOML parse error if the file is malformed; `wrangler deploy` in `.github/workflows/xa.yml` will fail clearly on invalid TOML); for pre-merge manual check: read the file and confirm all sections have correct `[header]` and `key = value` syntax
- **Execution plan:**
  - Red: Read current `wrangler.toml` — confirm `[vars]` section is absent and `[env.preview.vars]` is comment-only (no `=` assignments)
  - Green: Add top-level `[vars]` section with all NEXT_PUBLIC vars (empty string defaults) and optional server vars (with numeric/string defaults); populate `[env.preview.vars]` with same content; add comment block listing all 7 required secrets with `wrangler secret put <VAR>` and `wrangler secret put <VAR> --env preview` instructions
  - Refactor: Verify TOML structure is correct; ensure `[vars]` appears before `[env.*]` sections for readability; add a brief deployment preamble comment at the top of the relevant section
- **Planning validation (required for M/L):** None: S effort task
- **Scouts:** None: wrangler.toml structure confirmed; TOML syntax is simple; no probes needed
- **Edge Cases & Hardening:**
  - `R2_UPLOAD_URL = ""` disables R2 upload feature — this is the correct default; document in a comment that setting this enables R2 image upload
  - `R2_DESTINATION` defaults to `""` (operator sets to R2 bucket path when enabling R2)
  - Filesystem-only vars (`XA_UPLOADER_PRODUCTS_CSV_PATH`, `XA_UPLOADER_NEXT_DIST_DIR`) must NOT appear in `[vars]` — they are not valid in a Cloudflare Worker environment
  - **NEXT_PUBLIC build-time inlining:** add comment in `[vars]` section noting that `NEXT_PUBLIC_*` vars are baked into the client bundle at build time; changing them in `[vars]` only affects server-side code — for client-side behavior changes, provide these vars in the build environment before running `opennextjs-cloudflare build`
  - **Schema identity with `.env.example`:** var names and defaults in `wrangler.toml [vars]` must exactly mirror the NEXT_PUBLIC and optional server var sections of `.env.example` (TASK-01); sequential dependency on TASK-01 ensures this — acceptance criteria include cross-check
  - **Cross-check acceptance:** after TASK-02 execution, verify that every NEXT_PUBLIC and optional server var in TASK-01's `.env.example` appears in `[vars]` with a matching default; no extra vars, no missing vars
- **What would make this >=90%:**
  - Actual R2 deployment values (NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL, NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION) provided by operator — but empty defaults are correct for now and do not block delivery
- **Rollout / rollback:**
  - Rollout: Edit existing file; changes are immediately visible on next `wrangler deploy`
  - Rollback: Revert `wrangler.toml` via git; no runtime state affected
- **Documentation impact:**
  - `wrangler.toml` becomes self-documenting via comments; `.env.example` (TASK-01) is the complementary reference
- **Notes / references:**
  - Production `[vars]` and `[env.preview.vars]` should mirror each other for this task — both start with empty defaults
  - Future: operator sets actual R2 values in Cloudflare dashboard or commits them to `[vars]` when R2 upload feature is enabled
  - `NEXT_PUBLIC_*` vars in `wrangler.toml [vars]` are available to server-side Worker runtime code. They are NOT updated in client bundles at runtime — the bundle inlines the build-time values. For client-side changes to take effect, the operator must rebuild with the new values in the build environment. A comment in `[vars]` must explain this.

**Build Evidence (2026-02-28):**
- Red phase: confirmed `[vars]` absent and `[env.preview.vars]` comment-only in prior wrangler.toml
- Green phase: added top-level `[vars]` section with 4 NEXT_PUBLIC vars (active, empty/1600 defaults), `XA_UPLOADER_MODE` (active), `XA_TRUST_PROXY_IP_HEADERS = "1"` (active, CF Workers default), 13 optional tuning vars (commented); populated `[env.preview.vars]` with identical content; added required-secrets comment block (9 `wrangler secret put` lines for all 7 required secrets + optional vendor token) plus NEXT_PUBLIC inlining warning
- Refactor phase: all 5 TCs passed; cross-check confirms schema identity with TASK-01 `.env.example`; filesystem-only vars excluded; dev/E2E vars excluded
- Post-build validation: Mode 3 (Document Review) — Attempt 1 — **Pass**. All required secrets listed, NEXT_PUBLIC inlining note present, no secret values committed, valid TOML structure.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create `.env.example` | Yes | None | No |
| TASK-02: Update `wrangler.toml` `[vars]` | Yes — TASK-01 must be complete first | None | No |

No Critical simulation findings. Tasks are sequenced (TASK-02 after TASK-01) to ensure schema identity between `.env.example` and `wrangler.toml [vars]`.

## Risks & Mitigations
- Developer accidentally commits a real secret to `.env.example`: Low likelihood, High impact → mitigated by placeholder-only values and explicit header comment
- `wrangler.toml [vars]` with wrong values causes deployment misconfiguration: Low likelihood, Medium impact → mitigated by safe empty-string defaults (features degrade gracefully)
- `NEXTAUTH_SECRET`/`SESSION_SECRET`/`CART_COOKIE_SECRET` cause operator confusion about their origin: Low likelihood, Low impact → mitigated by inline comment in `.env.example`

## Observability
- Logging: None: documentation change
- Metrics: None: documentation change
- Alerts/Dashboards: None: documentation change

## Acceptance Criteria (overall)
- [ ] `apps/xa-uploader/.env.example` committed to repo with all vars documented and no real secret values
- [ ] `wrangler.toml` `[vars]` populated with NEXT_PUBLIC and optional server vars
- [ ] `wrangler.toml` `[env.preview.vars]` populated (not comment-only)
- [ ] Comment block in `wrangler.toml` lists all 7 required secrets with `wrangler secret put` commands
- [ ] Operator can follow `.env.example` + `wrangler.toml` comments to deploy from scratch without reading source code

## Decision Log
- 2026-02-28: TASK-01 and TASK-02 kept separate (Option A) — different concerns, different audiences, parallel execution; no operator input required

## Overall-confidence Calculation
- TASK-01: 90% × S (weight 1) = 90
- TASK-02: 85% × S (weight 1) = 85
- Overall = (90 + 85) / 2 = 87.5 → 85% (downward bias per scoring rules)
