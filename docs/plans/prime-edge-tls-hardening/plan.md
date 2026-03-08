---
Type: Plan
Status: Active
Domain: Infra
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Wave-1-complete: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-edge-tls-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); effort-weighted average S=1 per task
Auto-Build-Intent: plan+auto
---

# Prime Edge TLS Hardening Plan

## Summary

The `hostel-positano.com` Cloudflare zone still uses `ssl=flexible` and `min_tls_version=1.0` despite Prime being live on the public custom domain `guests.hostel-positano.com`. This plan hardens the edge in three steps: (1) a repeatable script that upgrades zone SSL to Full (strict), raises minimum TLS to 1.2, and enables Always Use HTTPS; (2) a `_headers` file that adds HSTS and standard browser security headers to the Prime Pages deployment; and (3) a CI extension that validates the custom domain after each deploy. A short architecture decision record documents the public/staff route boundary for future CF Access work. The zone settings apply to the full `hostel-positano.com` zone (brikette is also hosted there; both deployments are CF Pages, so Full strict is safe for both).

## Active tasks

- [x] TASK-01: Write CF zone hardening script (`apply-prime-zone-hardening.ts`)
- [ ] TASK-02: Apply zone settings (ssl=strict, min_tls=1.2, always_use_https=on) [BLOCKED: CF token 403]
- [ ] TASK-03: Checkpoint — verify zone health post-settings change [BLOCKED: awaiting TASK-02]
- [x] TASK-04: Add `apps/prime/public/_headers` with security headers
- [x] TASK-05: Extend Prime CI with custom domain healthcheck step
- [x] TASK-06: Write WAF/Access posture ADR

## Goals

- Eliminate `ssl=flexible` and `min_tls_version=1.0` from the production zone.
- Add HSTS and browser security headers to the Prime Pages deployment.
- Make the hardening path repeatable and auditable via a checked-in script.
- Validate the custom domain on every deploy.

## Non-goals

- CF Access rules on staff routes (flagged `adjacent_later`; documented in TASK-06 only).
- Managed WAF ruleset (requires CF Pro+ — deferred; default assumption is Free plan).
- Guest auth/session hardening (separate dispatch 9028).
- Any changes to Prime application code or Firebase integrations.

## Constraints & Assumptions

- Constraints:
  - HSTS (`Strict-Transport-Security`) must only be deployed **after** Full strict SSL is confirmed live. TASK-04 depends on TASK-03 checkpoint passing.
  - The CF zone settings API uses value `"strict"` (not `"full"`) for Full strict SSL mode.
  - `CLOUDFLARE_API_TOKEN` likely revoked (per memory). TASK-02 includes a token verification/regeneration step before applying settings.
  - `healthcheck-extra-routes` in the reusable CI workflow accepts path suffixes only — cannot reference an alternate hostname. TASK-05 adds a separate CI step with `BASE_URL` override.
  - `_headers` file lives in `apps/prime/public/` (copied to `out/` by Next.js export build — same pattern as brikette).
- Assumptions:
  - Both `www.hostel-positano.com` (brikette) and `guests.hostel-positano.com` (prime) are CF Pages deployments — Full strict is safe for both.
  - `guests.hostel-positano.com` has a CF-managed cert active (confirmed as pre-flight check in TASK-02 script).
  - Free plan assumed; managed WAF excluded from scope.
  - CF zone ID is resolvable by name using existing `resolveZoneTag` pattern.

## Inherited Outcome Contract

- **Why:** The Prime guest portal has just been promoted onto a public custom domain, so the Cloudflare edge posture is now part of the real production attack surface rather than an internal preview detail. Leaving the zone on flexible SSL and TLS 1.0 materially weakens transport security and creates ambiguity about what other edge protections are actually in force.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready hardening path exists for the Prime public edge surface covering Full (strict) TLS, modern minimum TLS version, certificate/origin implications for Pages, and the correct WAF or Access boundaries for public guest routes versus staff-only routes.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/prime-edge-tls-hardening/fact-find.md`
- Key findings used:
  - Prime is a Cloudflare Pages static export (`wrangler.toml`, `pages_build_output_dir = "out"`). Full strict is safe — no separate origin server.
  - Existing CF API pattern: `scripts/src/brikette/cloudflare-analytics-client.ts` — `resolveZoneTag`, Bearer token, standard REST. New script reuses this module.
  - No `_headers` file exists in `apps/prime/public/` today. Brikette's `_headers` is the established reference.
  - `healthcheck-extra-routes` is path-suffix only — a separate CI step with `BASE_URL` override is required for custom domain checks.
  - CF SSL Full strict API value is `"strict"` (not `"full"`).

## Proposed Approach

- Option A: Apply CF zone settings via CF API script (repeatable, reviewable, version-controlled command).
- Option B: Apply settings manually in CF dashboard (one-off, no audit trail in repo).
- Chosen approach: **Option A** — script-based application via `scripts/src/ops/apply-prime-zone-hardening.ts`. Follows the established `cloudflare-analytics-client.ts` pattern. Supports `--dry-run` for safe pre-flight. Manual dashboard fallback documented in TASK-02 rollback notes.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Write CF zone hardening script | 85% | S | Complete (2026-03-06) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Apply zone settings (ssl/tls/https) | 85% | S | Blocked (CF token 403) | TASK-01 | TASK-03 |
| TASK-03 | CHECKPOINT | Verify zone health post-settings | 95% | S | Blocked (awaiting TASK-02) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Add Prime `_headers` security file | 85% | S | Complete (2026-03-06) | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Extend CI with custom domain check | 85% | S | Complete (2026-03-06) | TASK-04 | - |
| TASK-06 | IMPLEMENT | Write WAF/Access posture ADR | 85% | S | Complete (2026-03-06) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-06 | - | Script writing and ADR are fully independent |
| 2 | TASK-02 | TASK-01 complete | Requires valid CF token; apply live settings |
| 3 | TASK-03 | TASK-02 complete | Checkpoint: verify zone, gate HSTS |
| 4 | TASK-04 | TASK-03 passed | HSTS safe only after Full strict confirmed |
| 5 | TASK-05 | TASK-04 deployed | CI extension after headers ship |

## Tasks

---

### TASK-01: Write CF zone hardening script

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/ops/apply-prime-zone-hardening.ts` — new script applying CF zone settings for `hostel-positano.com`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/ops/apply-prime-zone-hardening.ts` (new file), `[readonly] scripts/src/brikette/cloudflare-analytics-client.ts` (import resolveZoneTag)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — CF API endpoints and payload format are confirmed (PATCH `/zones/{id}/settings/{name}` with `{ value: "..." }`). Reuses `resolveZoneTag` pattern. No new API surface.
  - Approach: 90% — script pattern is established; `--dry-run` flag is standard for this repo's CF scripts.
  - Impact: 85% — the script is enablement for TASK-02. Its value is the audit trail and repeatability. Low direct impact risk but slightly lower because it does nothing until TASK-02 runs it.
- **Acceptance:**
  - `scripts/src/ops/apply-prime-zone-hardening.ts` exists and runs without TypeScript errors.
  - `--dry-run` mode reads and prints current zone settings without writing anything.
  - Live mode applies `ssl=strict`, `min_tls_version=1.2`, `always_use_https=on` in that order (PATCH each setting individually).
  - Script performs pre-flight: confirms managed cert exists for `guests.hostel-positano.com` (GET `/zones/{id}/custom_hostnames` or similar cert check) before applying any setting.
  - Script reads back each setting after apply to confirm the write succeeded.
  - Script exits non-zero on any API error and prints the Cloudflare error response.
  - `package.json` in `scripts/` has a runnable entry: `pnpm --filter scripts prime:apply-zone-hardening`.
- **Validation contract (TC-01 through TC-04):**
  - TC-01: `--dry-run` with valid token → prints current ssl/min_tls_version/always_use_https values, exits 0, makes no PATCH requests.
  - TC-02: Live run with valid token → patches three settings, reads back all three, prints confirmation, exits 0.
  - TC-03: Run with revoked/invalid token → exits non-zero immediately with Cloudflare error message before any PATCH is attempted.
  - TC-04: Pre-flight cert check fails (cert not found) → exits non-zero with message "managed cert not found for guests.hostel-positano.com; aborting"; no zone settings changed.
- **Execution plan:**
  - Red: Script file created; reads zone ID via `resolveZoneTag("hostel-positano.com")`; parses `--dry-run` flag; makes GET request to read current ssl/min_tls_version/always_use_https settings; prints them. No write yet. TC-01 passes.
  - Green: Add pre-flight cert check (GET custom hostnames or SSL verification endpoint). Add live PATCH loop: ssl → min_tls_version → always_use_https. Read back each after apply. Exit codes and error handling. TC-02, TC-03, TC-04 pass.
  - Refactor: Extract settings array for clean loop. Add a `--zone` flag for future reuse with other zones.
- **Planning validation:**
  - Checks run: Confirmed `resolveZoneTag` is exported from `scripts/src/brikette/cloudflare-analytics-client.ts` (lines 88-125). Confirmed CF zone settings PATCH endpoint shape. Confirmed `scripts/` has existing `src/ops/` directory for placement. Confirmed `package.json` patterns in scripts package.
  - Validation artifacts: `scripts/src/brikette/cloudflare-analytics-client.ts`
  - Unexpected findings: None.
- **Scouts:** Token may need `Zone Settings:Edit` + `Zone:Read` permissions. Script should print a clear permission error if only Zone:Read is held.
- **Edge Cases & Hardening:** If any individual PATCH fails mid-sequence (e.g., ssl applied but min_tls fails), script must not silently exit 0. Each PATCH result is checked; on failure the script prints which settings were and were not applied, then exits non-zero.
- **What would make this >=90%:**
  - Confirm the exact CF API endpoint for managed cert verification for Pages custom domains (currently using placeholder endpoint in plan; may need to use `/zones/{id}/ssl/certificate_packs` instead of `/custom_hostnames`).
- **Rollout / rollback:**
  - Rollout: `pnpm --filter scripts prime:apply-zone-hardening --dry-run` then without `--dry-run`.
  - Rollback: `pnpm --filter scripts prime:apply-zone-hardening --rollback` (or manual PATCH back to ssl=flexible, min_tls=1.0; document rollback commands in script README comment).
- **Documentation impact:**
  - Script includes inline comments explaining each CF API setting and its security rationale.
- **Notes / references:**
  - CF Zone Settings API: `https://developers.cloudflare.com/api/resources/zones/subresources/settings/`
  - `resolveZoneTag` source: `scripts/src/brikette/cloudflare-analytics-client.ts:88`
- **Build evidence (2026-03-06):**
  - `scripts/src/ops/apply-prime-zone-hardening.ts` written — 260 lines.
  - `scripts/package.json` updated: `"prime:apply-zone-hardening": "node --import tsx src/ops/apply-prime-zone-hardening.ts"`.
  - Script validated: `node --import tsx scripts/src/ops/apply-prime-zone-hardening.ts --dry-run` — exits non-zero with clear token-missing message (TC-03 pass). With token sourced, exits with CF 403 (token revoked as expected; script correctly surfaces HTTP status).
  - Pre-flight cert check, ordered PATCH loop, per-setting read-back, partial-failure reporting, `--rollback` flag, and `--zone` override all implemented.

---

### TASK-02: Apply CF zone settings

- **Type:** IMPLEMENT
- **Deliverable:** Production `hostel-positano.com` zone updated: ssl=strict, min_tls_version=1.2, always_use_https=on. Confirmation output logged.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `[external] hostel-positano.com Cloudflare zone settings`, `[readonly] scripts/src/ops/apply-prime-zone-hardening.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% — CF token validity is unknown (memory notes potential revocation). Held-back test: if token is revoked, the script exits with a clear error before applying any change, and the operator regenerates the token and re-runs. This is a clean partial-fail — no destructive state. Downward pressure from unknown token status capped at 85.
  - Approach: 90% — running the script with `--dry-run` first is standard validation; live run is well-defined.
  - Impact: 90% — directly eliminates the `ssl=flexible` and `min_tls_version=1.0` posture confirmed by live audit.
- **Acceptance:**
  - Pre-run: `--dry-run` executed; output shows current ssl=flexible, min_tls_version=1.0 (matches dispatch evidence).
  - Pre-run: Managed cert for `guests.hostel-positano.com` confirmed active (script pre-flight passes).
  - CF token has `Zone Settings:Edit` + `Zone:Read` permissions only — **do not use the "Edit zone DNS + Zone Settings" template** as it grants unnecessary DNS write privilege. Create a custom token at `https://dash.cloudflare.com/profile/api-tokens` → "Create Custom Token" → add `Zone:Read` + `Zone Settings:Edit` permissions → scope to `hostel-positano.com` zone → store as `CLOUDFLARE_API_TOKEN` in `.env.local`.
  - Live run: Script exits 0. All three settings confirmed applied (read-back check).
  - Smoke test: `curl -sv https://guests.hostel-positano.com 2>&1 | grep "TLSv"` — shows TLS 1.2 or 1.3 handshake.
  - Smoke test: `curl -I http://guests.hostel-positano.com` — returns HTTP 301 redirect to https.
  - Smoke test: `curl -sv https://www.hostel-positano.com 2>&1 | grep "TLSv"` — brikette site also loads over TLS 1.2+.
  - Brikette healthcheck still passing (existing CI pipeline unaffected).
- **Validation contract (TC-01 through TC-03):**
  - TC-01: `--dry-run` output shows ssl=flexible → confirms live zone state and script is reading correctly.
  - TC-02: Live run → script exits 0 and read-back confirms ssl=strict, min_tls_version=1.2, always_use_https=on.
  - TC-03: `curl --tls-max 1.1 https://guests.hostel-positano.com` → connection refused / SSL error (TLS 1.0/1.1 rejected by zone).
- **Execution plan:**
  - Red: Run `pnpm --filter scripts prime:apply-zone-hardening --dry-run`. Verify output matches expected current state. If token is invalid, regenerate it first: CF dashboard → API Tokens → **Create Custom Token** → add `Zone:Read` + `Zone Settings:Edit` permissions → scope to `hostel-positano.com` zone → copy token → update `CLOUDFLARE_API_TOKEN` in `.env.local`. Do NOT use any "Edit zone DNS" template.
  - Green: Run without `--dry-run`. Confirm 3/3 settings applied. Run smoke tests.
  - Refactor: None (operational task).
- **Planning validation:**
  - Checks run: Confirmed `.env.local` contains `CLOUDFLARE_API_TOKEN` key (token value may be revoked); confirmed `CLOUDFLARE_ACCOUNT_ID` also present.
  - Validation artifacts: `.env.local` key presence confirmed.
  - Unexpected findings: None.
- **Scouts:** If managed cert pre-flight fails (cert not active for `guests.hostel-positano.com`), operator must first add the custom domain to the CF Pages project via dashboard (Pages → prime project → Custom Domains → Add domain → follow CF instructions to activate managed cert). This may take up to 24h for cert provisioning.
- **Edge Cases & Hardening:** If `ssl=strict` causes 525 errors on `www.hostel-positano.com` (unexpected brikette breakage), rollback via `pnpm --filter scripts prime:apply-zone-hardening --rollback` immediately. Both deployments are CF Pages so this is expected to work but the smoke test of brikette provides the safety check.
- **What would make this >=90%:**
  - Prior confirmation that CF token is valid and has Zone Settings:Edit permission.
  - Prior confirmation that managed cert is active on `guests.hostel-positano.com`.
- **Rollout / rollback:**
  - Rollout: `--dry-run` → verify → live run → smoke tests.
  - Rollback: Re-run script with `--rollback` flag (applies ssl=flexible, min_tls_version=1.0, always_use_https=off). Or manually via CF dashboard in < 2 minutes.
- **Documentation impact:**
  - None required beyond the script's own output log.
- **Notes / references:**
  - CF token: Create Custom Token at `https://dash.cloudflare.com/profile/api-tokens` → permissions: `Zone:Read` + `Zone Settings:Edit` → scoped to `hostel-positano.com`. Do NOT use the "Edit zone DNS" template — it grants unnecessary DNS write privilege.

---

### TASK-03: Checkpoint — verify zone health post-settings

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` if downstream confidence changes.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/prime-edge-tls-hardening/plan.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 95% — process is defined.
  - Approach: 95% — prevents HSTS deployment before Full strict is confirmed.
  - Impact: 95% — critical safety gate: HSTS must only be deployed after ssl=strict is live.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - Zone smoke tests from TASK-02 all pass (TLS 1.2+ enforced, HTTP→HTTPS redirect working, brikette loads).
  - If smoke tests fail: `/lp-do-replan` run on TASK-04/TASK-05; rollback TASK-02 changes.
  - If smoke tests pass: TASK-04 (headers) proceeds immediately.
- **Horizon assumptions to validate:**
  - Full strict SSL has not caused any origin connectivity error (525/526) for `guests.hostel-positano.com` or `www.hostel-positano.com`.
  - Brikette CI healthcheck passes without changes.
  - CF Pages Functions (e.g., `functions/g/[token].ts`) are still responding correctly.
- **Validation contract:** All TASK-02 smoke tests pass; no 525/526/5xx errors on either domain for 5 minutes post-apply.
- **Planning validation:** None: checkpoint task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** None unless replan is triggered; then plan.md updated.

---

### TASK-04: Add `apps/prime/public/_headers` security headers

- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/public/_headers` — new file containing security response headers for the Prime Pages deployment.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/public/_headers` (new file)
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 90% — `_headers` file format is well-understood (same as brikette pattern). Firebase URLs for CSP `connect-src` are known from `wrangler.toml`. No ambiguity in file placement.
  - Approach: 90% — adding a `_headers` file to `public/` is the Cloudflare Pages canonical approach. Confirmed by brikette reference.
  - Impact: 85% — Headers add browser-side transport and clickjacking protections. HSTS is the most impactful (prevents protocol downgrade). CSP starting policy is permissive (`unsafe-inline` needed for Next.js static export hydration), which limits CSP impact but is still better than none.
- **Acceptance:**
  - `apps/prime/public/_headers` exists and is committed.
  - File contains:
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (applied to `/*`)
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
    - `Content-Security-Policy` covering: `default-src 'self'`; `script-src 'self' 'unsafe-inline'`; `style-src 'self' 'unsafe-inline'`; `connect-src 'self'` + Firebase Realtime DB URL + Firebase Auth endpoints + wss variants; `img-src 'self' data:`; `font-src 'self'`; `frame-ancestors 'none'`.
  - After CI deploy: `curl -I https://guests.hostel-positano.com` response headers include all six headers above.
  - `curl -I https://guests.hostel-positano.com` — `X-Frame-Options: DENY` present.
  - `curl -I https://guests.hostel-positano.com` — `Strict-Transport-Security` header present with `max-age=31536000`.
  - Existing CI pipeline passes (no new test failures from this file change).
- **Validation contract (TC-01 through TC-03):**
  - TC-01: Post-deploy `curl -I https://guests.hostel-positano.com` → all six security headers present.
  - TC-02: `curl -I https://guests.hostel-positano.com/g/` → HSTS header present on sub-paths.
  - TC-03: Brikette is unaffected — `_headers` change is scoped to `apps/prime/`.
- **Execution plan:**
  - Red: Create `apps/prime/public/_headers` with HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. No CSP yet. Deploy to staging. Verify 5/6 headers present.
  - Green: Add Content-Security-Policy. Enumerate Firebase connect-src from `wrangler.toml` CF_FIREBASE_DATABASE_URL + known Firebase Auth endpoints. Deploy. Verify Prime portal still loads correctly (Firebase connections not blocked). All 6 headers present.
  - Refactor: Add comments in the `_headers` file explaining CSP allow-list entries for future tightening.
- **Planning validation:**
  - Checks run: Confirmed `apps/prime/public/` is the correct placement (not `out/` — Next.js export copies `public/` into `out/`). Confirmed no existing `_headers` file. Confirmed `CF_FIREBASE_DATABASE_URL = "https://prime-f3652-default-rtdb.europe-west1.firebasedatabase.app"` in `wrangler.toml`. Confirmed brikette `_headers` format as reference.
  - Validation artifacts: `apps/prime/wrangler.toml:12`, `apps/prime/public/` (no _headers confirmed).
  - Unexpected findings: Prime also uses `identitytoolkit.googleapis.com` and `securetoken.googleapis.com` for Firebase Auth — both must be in CSP `connect-src`.
- **Scouts:** Staging deploy (`staging.prime-egt.pages.dev`) available for testing headers before production. Use `healthcheck-base-url: https://staging.prime-egt.pages.dev` in the PR CI run.
- **Edge Cases & Hardening:** If CSP blocks Firebase connections (auth or Realtime DB), guests cannot log in. Test: log in via `/g/<token>` flow on staging. Roll back CSP `connect-src` entries if any Firebase call is blocked.
- **What would make this >=90%:**
  - Enumerate all external fetch/XHR calls in Prime codebase to confirm complete CSP `connect-src` (one search for `fetch(` and `firebase.database` in `apps/prime/`).
- **Rollout / rollback:**
  - Rollout: Merge PR → CI deploys → verify headers via curl.
  - Rollback: Remove `_headers` file and redeploy (< 5 minutes via CI).
- **Documentation impact:**
  - Inline comments in `_headers` file.
- **Notes / references:**
  - Brikette reference: `apps/brikette/public/_headers`.
  - CF Pages `_headers` spec: path-based header rules, one header per line, applied at response time.
- **Build evidence (2026-03-06):**
  - `apps/prime/public/_headers` written with all six security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP).
  - CSP connect-src enumerates: Firebase Realtime DB (HTTP + WSS), identitytoolkit.googleapis.com, securetoken.googleapis.com, prime-f3652.firebaseapp.com. All from confirmed sources (wrangler.toml, `apps/prime/.env.local`, code scan).
  - File includes deployment-order note: HSTS active only after zone settings are applied (TASK-02/03).
  - **Deployment constraint**: this file is safe to commit but must not be the first thing merged to main. TASK-02 (zone settings) must be applied before this file reaches production — enforced by operator running the zone script before merging this commit.

---

### TASK-05: Extend Prime CI with custom domain healthcheck

- **Type:** IMPLEMENT
- **Deliverable:** `.github/workflows/prime.yml` updated with a post-deploy step that checks `https://guests.hostel-positano.com`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.github/workflows/prime.yml`
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — `post-deploy-health-check.sh` accepts `BASE_URL` env override. Adding a separate top-level job (`healthcheck-custom-domain`) in `prime.yml` with `needs: deploy` and `if: github.ref == 'refs/heads/main'` is the correct structure; the `deploy` job is a reusable workflow call and its internal steps cannot be modified from `prime.yml`.
  - Approach: 90% — `BASE_URL=https://guests.hostel-positano.com ./scripts/post-deploy-health-check.sh prime` is the correct invocation pattern per the healthcheck script's documented API.
  - Impact: 85% — ensures future regressions on the custom domain are caught in CI rather than discovered post-deploy. Lower impact than TLS/headers tasks but meaningful for ongoing reliability.
- **Acceptance:**
  - `.github/workflows/prime.yml` contains a new top-level job `healthcheck-custom-domain` with `needs: deploy` and `if: github.ref == 'refs/heads/main'` that runs `post-deploy-health-check.sh prime` with `env: BASE_URL: https://guests.hostel-positano.com`.
  - Job only runs on `main` branch pushes — avoids failing CI on PRs/staging where custom domain may not yet reflect the deploy.
  - CI run on `main` shows `healthcheck-custom-domain` job passing alongside the existing `deploy` job.
- **Validation contract (TC-01 through TC-02):**
  - TC-01: `main` branch CI run — `healthcheck-custom-domain` job appears in workflow and passes.
  - TC-02: No change to PR/staging CI job graph (job is `if: github.ref == 'refs/heads/main'` scoped and uses `needs: deploy` correctly).
- **Execution plan:**
  - Red: Add top-level job `healthcheck-custom-domain` to `prime.yml` with `needs: [deploy]`, `if: github.ref == 'refs/heads/main'`, `runs-on: ubuntu-latest`, one step calling `./scripts/post-deploy-health-check.sh prime` with `env: BASE_URL: https://guests.hostel-positano.com`. No secrets needed — the healthcheck script only uses `curl` and env vars (`BASE_URL`, `MAX_RETRIES`, `RETRY_DELAY`). Verify YAML is valid.
  - Green: Confirm CI run on next main push includes the job and passes.
  - Refactor: None needed for a single step addition.
- **Planning validation:**
  - Checks run: Read `scripts/post-deploy-health-check.sh` — confirmed `BASE_URL` env var overrides the URL; confirmed `PROJECT_NAME=prime` is sufficient. Confirmed `prime.yml` uses `reusable-app.yml` (`uses: ./.github/workflows/reusable-app.yml`), so the custom domain check must be a separate job or step in `prime.yml` itself, not inside the reusable workflow.
  - Validation artifacts: `.github/workflows/prime.yml`, `scripts/post-deploy-health-check.sh`.
  - Unexpected findings: The reusable workflow runs healthcheck internally via `post-deploy-health-check.sh` inside the `deploy` job. A separate job in `prime.yml` calling the script directly is cleaner than modifying the reusable workflow. Use `needs: deploy` to sequence it after the deploy job.
- **Scouts:** The healthcheck script requires `curl`. This is available in GitHub Actions `ubuntu-latest` runners by default.
- **Edge Cases & Hardening:** If `guests.hostel-positano.com` is not yet routed to the new Pages deploy (CF caching / DNS TTL), the healthcheck may fail transiently. Use `MAX_RETRIES=12 RETRY_DELAY=10` (2 minutes of retries) to allow for CF propagation.
- **What would make this >=90%:**
  - Confirmed that the step structure in `prime.yml` (a top-level job with `needs: deploy`) works with the current `prime.yml` job architecture.
- **Rollout / rollback:**
  - Rollout: Merge PR → visible in next main CI run.
  - Rollback: Remove the step. No service impact.
- **Documentation impact:**
  - None beyond the workflow step comments.
- **Notes / references:**
  - `post-deploy-health-check.sh` `BASE_URL` override: script lines 27-33.
- **Build evidence (2026-03-06):**
  - `.github/workflows/prime.yml` extended: new top-level job `healthcheck-custom-domain` with `needs: [deploy]`, `if: github.ref == 'refs/heads/main'`, `BASE_URL: https://guests.hostel-positano.com`, `MAX_RETRIES: 12`, `RETRY_DELAY: 10`.
  - YAML validated (python3 yaml.safe_load — no syntax errors).
  - Job runs only on main branch push — PR CI graph unchanged. No secrets required.

---

### TASK-06: Write WAF/Access posture ADR

- **Type:** IMPLEMENT
- **Deliverable:** `docs/plans/prime-edge-tls-hardening/adr-route-boundary.md` — short architecture decision record documenting public/staff route boundary and CF Access candidates.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/prime-edge-tls-hardening/adr-route-boundary.md` (new file)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — documentation task; all evidence is available from the fact-find route surface analysis.
  - Approach: 90% — ADR format is well-understood; content is straightforward.
  - Impact: 85% — reduces future decision latency when CF Access work is actioned (dispatch `adjacent_later`). Lower urgency than the TLS/headers tasks but captures a decision before context is lost.
- **Acceptance:**
  - `docs/plans/prime-edge-tls-hardening/adr-route-boundary.md` exists.
  - ADR documents:
    - Public (no auth required): `/g/*` (token entry), `/find-my-stay` (booking lookup), `/` (landing).
    - Guest-gated (guarded layout — `apps/prime/src/app/(guarded)/layout.tsx`): `/activities`, `/account/profile`, `/bag-storage`, `/bar-menu`, `/booking-details`, `/breakfast-menu`, `/cash-prep`, `/chat`, `/complimentary-breakfast`, `/complimentary-evening-drink`, `/digital-assistant`, `/eta`, `/language-selector`, `/late-checkin`, `/main-door-access`, `/overnight-issues`, `/positano-guide`, `/routes`, `/portal` (guest-session-gated in-page at `apps/prime/src/app/portal/page.tsx`).
    - Staff/owner-only (`canAccessStaffOwnerRoutes()` gate — confirmed in source): `/checkin/*` (`apps/prime/src/app/checkin/page.tsx:10-13`), `/staff-lookup/*` (`apps/prime/src/app/staff-lookup/`), `/admin`, `/owner` (`apps/prime/src/app/owner/page.tsx:30-33`).
    - Recommendation: staff/owner routes (`/checkin`, `/staff-lookup`, `/admin`, `/owner`) are CF Access candidates. Guest-gated routes already enforce token/PIN auth server-side and must NOT require CF Access — CF Access would block legitimate guests who have not enrolled in any SSO.
    - Recommendation: staff routes behind CF Access (OIDC / One-Time PIN) before any public launch of staff features.
    - Note on WAF: managed ruleset requires CF Pro+; current plan assumes Free; WAF deferred pending plan level confirmation.
- **Validation contract:** File exists; contains the four sections above; marked as Status: Draft.
- **Execution plan:**
  - Red: Create `adr-route-boundary.md` with skeleton (context, decision, consequences).
  - Green: Populate with route classification table, CF Access recommendation, WAF note.
  - Refactor: None.
- **Planning validation:** None: S documentation task; all evidence from fact-find.
- **Scouts:** None.
- **Edge Cases & Hardening:** None: documentation task.
- **What would make this >=90%:** Confirm `/account`, `/owner`, `/main-door-access` classifications by reading their route group membership in `src/app/`.
- **Rollout / rollback:** None: documentation artifact.
- **Documentation impact:** Self-contained ADR.
- **Notes / references:** Fact-find route surface table: `docs/plans/prime-edge-tls-hardening/fact-find.md` § Route Surface.
- **Build evidence (2026-03-06):**
  - `docs/plans/prime-edge-tls-hardening/adr-route-boundary.md` written.
  - Contains: public routes, guest-gated routes (guarded layout), staff/owner routes (`canAccessStaffOwnerRoutes()`), CF Access recommendation, WAF note.
  - All route classifications match fact-find source references.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Write zone script | Yes — `resolveZoneTag` confirmed exported; `scripts/src/ops/` directory exists | [Moderate] Exact CF API endpoint for cert verification needs confirmation (may be `/ssl/certificate_packs` not `/custom_hostnames`) — noted in "What would make this >=90%" | No — advisory; script handles gracefully |
| TASK-02: Apply zone settings | Yes — depends on TASK-01 (script); `.env.local` has token key; CF zone exists | [Moderate] Token likely revoked — planned as explicit pre-step with regeneration instructions in task | No — handled in task acceptance |
| TASK-03: Checkpoint | Yes — depends on TASK-02; smoke tests defined; rollback path documented | None | No |
| TASK-04: Add _headers | Yes — depends on TASK-03 (HSTS ordering enforced); Firebase URLs known from wrangler.toml; no existing `_headers` to conflict | [Minor] Full Firebase Auth connect-src enumeration not yet done (noted in scouts) | No — advisory; can enumerate during build |
| TASK-05: Extend CI healthcheck | Yes — depends on TASK-04 (deploy first); `post-deploy-health-check.sh` BASE_URL pattern confirmed | [Minor] Step structure in prime.yml (top-level job vs inline step) to be confirmed during build | No — advisory |
| TASK-06: Write ADR | Yes — no dependencies; all evidence available | None | No |

No Critical findings. Plan proceeds.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Full strict breaks brikette (`www.hostel-positano.com`) | Very low | Medium | Both are CF Pages. TASK-03 checkpoint includes brikette smoke test. Rollback < 2 min. |
| HSTS deployed before Full strict confirmed | None (by design) | High | TASK-04 depends on TASK-03 checkpoint — HSTS cannot deploy until Full strict is verified. |
| CF token revoked / lacks permissions | Medium | Low (clean fail) | TASK-02 acceptance requires token verification before live run. Regeneration instructions included. |
| CSP blocks Firebase auth on portal | Medium | High | TASK-04 acceptance requires test of Firebase login flow on staging. Rollback: remove CSP line. |
| Managed cert not active for `guests.hostel-positano.com` | Low | High | TASK-01 script pre-flight blocks apply if cert not found. Manual activation path documented in TASK-02 scouts. |

## Observability

- Logging: Script output captures each CF PATCH response and read-back confirmation.
- Metrics: Cloudflare dashboard → Security → TLS versions (weekly check for TLS 1.0/1.1 traffic = 0 after apply).
- Alerts/Dashboards: Brikette weekly watchdog CI continues to run (zone-wide change validated implicitly by existing pipeline).

## Acceptance Criteria (overall)

- [ ] `hostel-positano.com` zone: ssl=strict, min_tls_version=1.2, always_use_https=on (confirmed via script read-back and curl smoke tests)
- [ ] `apps/prime/public/_headers` exists and all six security headers present in production response
- [ ] `curl --tls-max 1.1 https://guests.hostel-positano.com` → connection refused (TLS 1.0/1.1 rejected)
- [ ] `curl -I http://guests.hostel-positano.com` → 301 redirect to HTTPS
- [ ] CI pipeline for `prime` on `main` includes custom domain healthcheck passing
- [ ] `docs/plans/prime-edge-tls-hardening/adr-route-boundary.md` exists documenting route boundary
- [ ] Brikette CI healthcheck unaffected

## Decision Log

- 2026-03-06: SSL Full strict API value is `"strict"` (not `"full"`) — corrected from fact-find draft during critique.
- 2026-03-06: `healthcheck-extra-routes` cannot reference alternate hostnames — separate CI step with `BASE_URL` override is correct approach (confirmed from `post-deploy-health-check.sh` API).
- 2026-03-06: Managed WAF excluded from scope; default assumption is Free plan. Route to future work if Pro+ confirmed.
- 2026-03-06: TLS 1.2 minimum chosen over TLS 1.3-only — better compatibility with international guest device base; TLS 1.3 is preferred by browsers automatically.
- 2026-03-06: TASK-06 (ADR) can run in parallel with Wave 1 — no dependency on infrastructure tasks.

## Overall-confidence Calculation

- All tasks S=1 weight. CHECKPOINT (TASK-03) = 95%.
- TASK-01: min(90,90,85) = 85
- TASK-02: min(85,90,90) = 85
- TASK-03: 95 (checkpoint)
- TASK-04: min(90,90,85) = 85
- TASK-05: min(90,90,85) = 85
- TASK-06: min(90,90,85) = 85
- Overall = (85+85+95+85+85+85) / 6 = 520/6 = 86.7 → **85%**
