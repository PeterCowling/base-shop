---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Build-started: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-security-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/xa-uploader-security-hardening/analysis.md
---

# XA Uploader Security Hardening Plan

## Summary

This plan closes two substantive security gaps in the xa-uploader admin tool: (1) the IP allowlist silently defaults to allow-all when `XA_UPLOADER_ALLOWED_IPS` is unset, and (2) session tokens cannot be revoked before their 7-day expiry. The chosen approach (Option B from analysis) promotes the IP allowlist from an optional Worker var to a required Cloudflare secret enforced by the existing preflight script, flips the runtime default to deny-all, adds a once-per-process runtime coherence warning for proxy-trust misconfiguration, and introduces KV-backed session revocation. Security event logging and a timing-leak fix ship in the same pass.

## Active tasks
- [x] TASK-01: IP allowlist deny-all default + preflight enforcement + coherence warning
- [x] TASK-02: KV-backed session revocation
- [x] TASK-03: Security event logging
- [x] TASK-04: Timing-safe version check fix

## Goals
- Change IP allowlist default from allow-all to deny-all when `XA_UPLOADER_ALLOWED_IPS` is unset or empty.
- Add `XA_UPLOADER_ALLOWED_IPS` to `XA_UPLOADER_REQUIRED_CF_SECRET_NAMES` so preflight blocks deploy when the secret is missing.
- Add once-per-process runtime coherence warning when allowlist is non-empty but `XA_TRUST_PROXY_IP_HEADERS` is disabled.
- Implement KV-backed session revocation via minimum-issuedAt check.
- Add structured security event logging via existing `uploaderLog()`.
- Fix non-constant-time version check in `verifySessionToken`.

## Non-goals
- Distributed rate limiting (P2 — deferred).
- Content-Length handling changes (non-issue).
- CSP tightening (acceptable for internal admin tool).
- Full monitoring/alerting infrastructure.
- Session TTL reduction (deferred to operator decision — no refresh mechanism exists).

## Constraints & Assumptions
- Constraints:
  - KV namespace production ID is a placeholder (`REPLACE_WITH_PROD_NS_ID`) in `wrangler.toml:23` — must be resolved before TASK-02 deploys.
  - `XA_UPLOADER_ALLOWED_IPS` is currently an optional Worker var in `wrangler.toml [vars]` (commented out at line 89/139). Option B promotes it to a required Cloudflare secret.
  - Backward compatibility with existing session cookies required — old tokens expire naturally via 7-day TTL.
  - KV namespace `XA_UPLOADER_KV` is shared with deploy cooldown/pending-state flows (`deployHook.ts`, `deploy-drain/route.ts`).
  - Tests run in CI only (per testing policy). No local test execution.
- Assumptions:
  - KV reads are sub-ms in Cloudflare (well-documented platform characteristic).
  - Operator accesses the admin tool infrequently (admin-only workflow).

## Inherited Outcome Contract

- **Why:** Right now, if someone accidentally deletes the IP allowlist setting, the entire admin tool becomes publicly accessible with no warning. Session tokens also cannot be revoked before their 7-day expiry, meaning a stolen cookie remains valid for up to a week.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** IP allowlist rejects by default when unconfigured; session revocation mechanism exists via KV-backed minimum-issuedAt check; session verification is fully timing-safe.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/xa-uploader-security-hardening/analysis.md`
- Selected approach inherited:
  - Option B: Preflight existence check + single-pass implementation with runtime coherence warning.
  - Promote `XA_UPLOADER_ALLOWED_IPS` from optional `[vars]` to required Cloudflare secret.
  - Runtime deny-all default when secret is unset/empty.
  - Once-per-process runtime coherence warning when allowlist is non-empty but proxy trust is disabled.
  - No wildcard (`*`) support — preview environments use explicit IPs; staging CI passes on 404.
- Key reasoning used:
  - Preflight catches the most common failure mode (missing secret) before deploy, which is strictly safer than runtime-only detection.
  - The preflight pattern already exists (`XA_UPLOADER_REQUIRED_CF_SECRET_NAMES` in `uploaderRuntimeConfig.ts`); adding one entry is a one-line change.

## Selected Approach Summary
- What was chosen:
  - Option B — Preflight existence check with single-pass implementation, supplemented by once-per-process runtime coherence warning.
- Why planning is not reopening option selection:
  - Analysis decisively settled on Option B with explicit rejection of Options A and C. No new evidence has emerged since analysis.

## Fact-Find Support
- Supporting brief: `docs/plans/xa-uploader-security-hardening/fact-find.md`
- Evidence carried forward:
  - IP allowlist allow-all default at `accessControl.ts:21` — `if (!allowlisted.size) return true`
  - Session tokens: self-contained HMAC payloads with 7-day TTL (`SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7`), no server-side state, no revocation
  - KV access pattern via `syncMutex.ts:44` (`getUploaderKv()`)
  - Preflight lists secret names at `preflight-deploy.ts:316` but cannot read values
  - Structured logger at `uploaderLogger.ts` — ready seam for security events
  - Test landscape: `accessControl.test.ts` (6 tests), `uploaderAuth.test.ts` (2 tests)
  - No existing tests for `preflight-deploy.ts`

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | IP allowlist deny-all + preflight + coherence warning | 85% | M | Complete (2026-03-12) | - | TASK-03 |
| TASK-02 | IMPLEMENT | KV-backed session revocation | 85% | M | Complete (2026-03-12) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Security event logging | 85% | S | Complete (2026-03-12) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Timing-safe version check fix | 90% | S | Complete (2026-03-12) | TASK-03 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A: no UI changes — admin tool middleware/library layer only | - | |
| UX / states | N/A: no UX changes — admin requests are denied/allowed at middleware level | - | |
| Security / privacy | Required: deny-all default, preflight enforcement, session revocation, coherence warning, timing-safe comparison | TASK-01, TASK-02, TASK-04 | Primary purpose of this plan |
| Logging / observability / audit | Required: structured security event logging via `uploaderLog()` | TASK-03 | Uses existing logger seam |
| Testing / validation | Required: updated deny-all tests, new revocation tests, new coherence warning tests, new preflight tests | TASK-01, TASK-02, TASK-03, TASK-04 | Preflight tests are net-new harness |
| Data / contracts | Required: new KV key `xa:revocation:min_issued_at` for session revocation | TASK-02 | Shared KV namespace with deploy flows |
| Performance / reliability | Required: one KV read per authenticated request for revocation check | TASK-02 | Sub-ms per Cloudflare KV SLA |
| Rollout / rollback | Required: operator must provision `XA_UPLOADER_ALLOWED_IPS` as Cloudflare secret before deploy | TASK-01 | Preflight blocks deploy if missing |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent — TASK-01 is IP allowlist, TASK-02 is session revocation. Can be built in parallel. |
| 2 | TASK-03 | TASK-01, TASK-02 | Logging depends on both security features being in place to emit events for. |
| 3 | TASK-04 | TASK-03 | Timing fix in same file as revocation; ships last as lowest priority. |

## Delivered Processes
None: this plan delivers code changes only; no new operational processes are introduced.

## Tasks

### TASK-01: IP allowlist deny-all default + preflight enforcement + coherence warning
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/xa-uploader/src/lib/accessControl.ts`, `apps/xa-uploader/src/lib/uploaderRuntimeConfig.ts`, `apps/xa-uploader/src/lib/__tests__/accessControl.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/xa-uploader/src/lib/accessControl.ts`, `apps/xa-uploader/src/lib/uploaderRuntimeConfig.ts`, `apps/xa-uploader/src/lib/__tests__/accessControl.test.ts`, `apps/xa-uploader/wrangler.toml`, `[readonly] apps/xa-uploader/scripts/preflight-deploy.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% - All seams are verified: `accessControl.ts:21` has the allow-all default, `uploaderRuntimeConfig.ts:6` has the required secrets array, `accessControl.test.ts:38-43` has the test to update. Coherence warning is new code but simple (two env var reads + one-time flag).
  - Approach: 90% - Analysis decisively selected Option B; implementation path is clear.
  - Impact: 85% - Directly closes the highest-severity gap (allow-all default). Preflight enforcement adds deploy-time safety net.
- **Acceptance:**
  - [ ] `isUploaderIpAllowedByHeaders()` returns `false` when `XA_UPLOADER_ALLOWED_IPS` is unset or empty.
  - [ ] `XA_UPLOADER_ALLOWED_IPS` is added to `XA_UPLOADER_REQUIRED_CF_SECRET_NAMES` in `uploaderRuntimeConfig.ts`.
  - [ ] Commented-out `XA_UPLOADER_ALLOWED_IPS` entries removed from `wrangler.toml [vars]` sections (lines 89 and 139) — the value is now a secret, not a var.
  - [ ] Once-per-process coherence warning logged when allowlist is non-empty but `XA_TRUST_PROXY_IP_HEADERS` is falsy — uses `uploaderLog("warn", "security_coherence_mismatch", ...)`.
  - [ ] Coherence warning fires at most once per Worker isolate process (module-level flag deduplication).
  - [ ] All existing tests updated; new tests added for deny-all default and coherence warning.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: N/A - no UX changes
  - Security / privacy: Required - deny-all default closes the primary exposure gap; preflight blocks deploy when secret is missing; coherence warning detects proxy-trust misconfiguration
  - Logging / observability / audit: Required - coherence warning emits structured log via `uploaderLog()`
  - Testing / validation: Required - update `accessControl.test.ts` line 42 assertion from `true` to `false`; add tests for coherence warning emission and deduplication
  - Data / contracts: N/A - no data schema changes
  - Performance / reliability: N/A - negligible overhead (one-time flag check per process)
  - Rollout / rollback: Required - operator must set `XA_UPLOADER_ALLOWED_IPS` as Cloudflare secret before deploy; preflight blocks if missing; rollback is redeploy from prior commit
- **Validation contract (TC-01):**
  - TC-01: `isUploaderIpAllowedByHeaders()` called with no `XA_UPLOADER_ALLOWED_IPS` env var -> returns `false`
  - TC-02: `isUploaderIpAllowedByHeaders()` called with empty string `XA_UPLOADER_ALLOWED_IPS=""` -> returns `false`
  - TC-03: `isUploaderIpAllowedByHeaders()` called with valid IPs and matching requester -> returns `true` (existing behavior preserved)
  - TC-04: `isUploaderIpAllowedByHeaders()` called with valid IPs and non-matching requester -> returns `false` (existing behavior preserved)
  - TC-05: coherence warning logged when allowlist is non-empty and `XA_TRUST_PROXY_IP_HEADERS` is unset/falsy -> `uploaderLog("warn", "security_coherence_mismatch")` called once
  - TC-06: coherence warning not logged on second call (deduplication) -> `uploaderLog` not called again. Test isolation: use `jest.resetModules()` + dynamic `require()` to get a fresh module instance with reset deduplication flag for each test case.
  - TC-07: `XA_UPLOADER_REQUIRED_CF_SECRET_NAMES` includes `"XA_UPLOADER_ALLOWED_IPS"` -> array membership check
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Update test at `accessControl.test.ts:42` to expect `false` instead of `true` for missing allowlist. Add new test for empty string. Add new tests for coherence warning emission and deduplication. All new tests fail initially.
  - **Green:** Change `accessControl.ts:21` from `if (!allowlisted.size) return true` to `if (!allowlisted.size) return false`. Add module-level coherence warning logic with `uploaderLog()` call and deduplication flag. Add `"XA_UPLOADER_ALLOWED_IPS"` to `XA_UPLOADER_REQUIRED_CF_SECRET_NAMES` array in `uploaderRuntimeConfig.ts`. Remove commented-out `XA_UPLOADER_ALLOWED_IPS` from `wrangler.toml` `[vars]` sections.
  - **Refactor:** Extract coherence check into a named function `checkIpCoherence()` for clarity.
- **Planning validation (required for M/L):**
  - Checks run: verified `accessControl.ts:21` has `if (!allowlisted.size) return true`, confirmed `uploaderRuntimeConfig.ts:6` has the required secrets array, confirmed `accessControl.test.ts:42` has `toBe(true)` assertion, confirmed `wrangler.toml:89` and `:139` have commented-out `XA_UPLOADER_ALLOWED_IPS`.
  - Validation artifacts: source file reads above.
  - Unexpected findings: none.
- **Consumer tracing:**
  - `isUploaderIpAllowedByHeaders()` is consumed by: `middleware.ts:35` (every request), `login/route.ts` (login endpoint), `session/route.ts` (session check). All consumers already handle the `false` return by returning a 404 response. The behavior change (deny when no allowlist) does not require consumer updates — the deny path already works.
  - `XA_UPLOADER_REQUIRED_CF_SECRET_NAMES` is consumed by: `preflight-deploy.ts:10,316`. The preflight iterates the array and checks for secret existence. Adding an entry requires no code changes to the consumer — the iteration handles it automatically.
  - Coherence warning: new output, consumed only by logging infrastructure (`wrangler tail`). No code consumers to update.
- **Scouts:** None: all relevant code paths verified via planning validation.
- **Edge Cases & Hardening:**
  - Empty-but-present secret (`XA_UPLOADER_ALLOWED_IPS=""` set as secret): `parseAllowlistedIps("")` returns empty Set, which now triggers deny-all. Correct behavior — operator should set actual IPs.
  - Whitespace-only secret: `parseAllowlistedIps` already trims entries; whitespace-only produces empty Set -> deny-all. Correct.
  - Coherence warning in test environment: `uploaderLog()` already no-ops when `NODE_ENV=test`. Warning code path is exercised but log output is suppressed. Tests must mock `uploaderLog` to verify the call.
  - Coherence warning deduplication test isolation: module-level flag persists across tests in the same suite. Tests for deduplication must use `jest.resetModules()` and dynamic `require()` to obtain fresh module instances with reset flags, or export a test-only `_resetCoherenceFlag()` function (guarded by `NODE_ENV=test`).
- **What would make this >=90%:**
  - Confirming preflight integration works end-to-end with the secret set in a real Cloudflare environment. Currently verified only by code inspection.
- **Rollout / rollback:**
  - Rollout: (1) Operator sets `XA_UPLOADER_ALLOWED_IPS` as Cloudflare secret in production and preview environments. (2) Deploy — preflight validates secret exists. (3) Verify admin tool access from allowlisted IP.
  - Rollback: Redeploy from prior commit via `wrangler deploy` from the previous commit hash. The allow-all default returns, but the secret remains configured for next deploy.
- **Documentation impact:**
  - Update `.env.example` comment to note that `XA_UPLOADER_ALLOWED_IPS` is now a required Cloudflare secret, not an optional `[vars]` entry.
- **Notes / references:**
  - Analysis: `docs/plans/xa-uploader-security-hardening/analysis.md` — Option B chosen approach.
- **Build evidence (2026-03-12):**
  - `accessControl.ts:63`: changed `if (!allowlisted.size) return true` to `return false` (deny-all default).
  - `uploaderRuntimeConfig.ts:9`: added `"XA_UPLOADER_ALLOWED_IPS"` to `XA_UPLOADER_REQUIRED_CF_SECRET_NAMES`.
  - `accessControl.ts:26-56`: added `checkIpCoherence()` with module-level deduplication flag and `_resetCoherenceWarningForTest()`.
  - `wrangler.toml`: removed commented-out `XA_UPLOADER_ALLOWED_IPS` from `[vars]` sections; documented as required secret.
  - `.env.example`: updated comment noting required secret with deny-all default.
  - `accessControl.test.ts`: updated deny-all test, added empty-string test, added 4 coherence warning tests.
  - Typecheck: pass. Lint: 0 errors.

### TASK-02: KV-backed session revocation
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/xa-uploader/src/lib/uploaderAuth.ts`, `apps/xa-uploader/src/lib/__tests__/uploaderAuth.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/xa-uploader/src/lib/uploaderAuth.ts`, `apps/xa-uploader/src/lib/syncMutex.ts`, `apps/xa-uploader/src/lib/__tests__/uploaderAuth.test.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% - KV access pattern is verified (`getUploaderKv()` in `syncMutex.ts:44`). Session token already contains `issuedAt` timestamp. Revocation check is a single KV read + comparison. The KV namespace production ID placeholder must be resolved, but this is an infrastructure step, not a code uncertainty.
  - Approach: 90% - Minimum-issuedAt is a standard revocation pattern. No alternative approaches considered necessary.
  - Impact: 85% - Provides the ability to invalidate all sessions issued before a given timestamp. Directly addresses the second gap from the outcome contract.
- **Acceptance:**
  - [ ] `verifySessionToken()` reads `xa:revocation:min_issued_at` from KV and rejects tokens with `issuedAt` before that timestamp.
  - [ ] KV read failure (null KV binding, network error) does not block session verification — fails open with a structured warning log. This is a deliberate operator-approved tradeoff: for an admin tool with infrequent use, availability is preferred over hard-blocking on KV failures. The primary security gap (allow-all default) is closed by TASK-01 independently of KV. Revocation is a secondary hardening measure.
  - [ ] Existing session tokens remain valid until their natural 7-day expiry or until revocation timestamp is set.
  - [ ] New export `revokeAllSessions(kv: UploaderKvNamespace)` writes current timestamp to `xa:revocation:min_issued_at` with no TTL.
  - [ ] Tests cover: revocation rejects old token, revocation allows new token, KV unavailable falls through, KV read error falls through.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: N/A - no UX changes
  - Security / privacy: Required - session revocation closes the second substantive gap; tokens can now be invalidated before 7-day expiry
  - Logging / observability / audit: Required - KV read failures logged via `uploaderLog("warn", "revocation_kv_unavailable")`
  - Testing / validation: Required - new tests for revocation flow with mock KV, KV unavailability fallback, token age vs revocation timestamp comparison
  - Data / contracts: Required - new KV key `xa:revocation:min_issued_at` (string timestamp in ms). No schema migration needed — KV is schemaless.
  - Performance / reliability: Required - one additional KV read per authenticated request. Sub-ms per Cloudflare KV SLA. KV unavailability fails open (does not block auth).
  - Rollout / rollback: Required - KV namespace production ID must be resolved before deploy. Rollback is redeploy from prior commit — revocation key remains in KV but is ignored by the old code.
- **Validation contract (TC-02):**
  - TC-01: `verifySessionToken()` with token issued at T=1000, revocation min_issued_at at T=2000 -> returns `false`
  - TC-02: `verifySessionToken()` with token issued at T=3000, revocation min_issued_at at T=2000 -> returns `true`
  - TC-03: `verifySessionToken()` with KV returning null (no revocation set) -> falls through to existing verification (returns `true` for valid token)
  - TC-04: `verifySessionToken()` with KV read throwing error -> falls through to existing verification with warning log
  - TC-05: `revokeAllSessions()` writes current timestamp to `xa:revocation:min_issued_at` -> KV.put called with correct key and value
  - TC-06: backward compat — existing valid token with no revocation key in KV -> returns `true`
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Add tests for revocation flow. Since `verifySessionToken()` is private (not exported), tests must use the public API: `hasUploaderSessionFromCookieHeader()` and `hasUploaderSession()`. Tests mock `getUploaderKv()` (following the established pattern in `route.publish.test.ts:19,81`) to return a mock KV namespace with a revocation timestamp. Tests fail because current auth flow has no KV awareness.
  - **Green:** Modify `verifySessionToken()` internally to call `getUploaderKv()` and read `xa:revocation:min_issued_at`. Compare token `issuedAt` against stored timestamp. Wrap KV operations in try/catch for fail-open behavior. Export `revokeAllSessions()` function as a new public API for external callers.
  - **Refactor:** Extract revocation check into a pure function `isTokenRevokedByTimestamp(issuedAt: number, minIssuedAt: number | null): boolean` and export it for direct unit testing of the comparison logic.
- **Planning validation (required for M/L):**
  - Checks run: verified `verifySessionToken()` at `uploaderAuth.ts:73-89` extracts `issuedAt` from token payload. Verified `getUploaderKv()` at `syncMutex.ts:44` returns `UploaderKvNamespace | null`. Verified KV mock pattern at `route.publish.test.ts:19,81`. Verified existing test at `uploaderAuth.test.ts:41-57`.
  - Validation artifacts: source file reads above.
  - Unexpected findings: `verifySessionToken()` is synchronous today. Adding KV read makes it async. `hasUploaderSessionFromCookieHeader()` is already async, so the async change propagates naturally. `hasUploaderSession()` is also already async.
- **Consumer tracing:**
  - `verifySessionToken()` is called by: `hasUploaderSessionFromCookieHeader()` (line 104-107). This is the only call site. Making it async is safe because the caller is already async.
  - `hasUploaderSessionFromCookieHeader()` is called by: `hasUploaderSession()` (line 99). Already async.
  - `hasUploaderSession()` is called by: `login/route.ts`, `session/route.ts`, and potentially other API routes. All callers already `await` the result.
  - New `revokeAllSessions()` export: no existing consumers. Will be consumed by TASK-03 (security event logging) or a future admin revocation endpoint.
- **Scouts:** None: all code paths and call chains verified.
- **Edge Cases & Hardening:**
  - KV namespace not bound (local dev, missing binding): `getUploaderKv()` returns `null` -> revocation check skipped -> session verification proceeds normally. Deliberate fail-open tradeoff — availability over hard-blocking for an admin tool with infrequent use.
  - `xa:revocation:min_issued_at` key does not exist in KV: `kv.get()` returns `null` -> revocation check skipped. Correct.
  - `xa:revocation:min_issued_at` contains non-numeric value: `Number()` returns `NaN`, `!Number.isFinite(NaN)` is `true` -> skip revocation check with warning log. Correct fail-open.
  - Concurrent revocation writes: last-write-wins is acceptable for revocation (timestamp only moves forward).
- **What would make this >=90%:**
  - KV namespace production ID resolved and verified in live environment. Currently blocked by placeholder.
- **Rollout / rollback:**
  - Rollout: (1) Resolve KV namespace production ID in `wrangler.toml:23`. (2) Deploy. (3) Verify session still works (no revocation key set = no change). (4) To revoke sessions, set `xa:revocation:min_issued_at` in KV via `wrangler kv:key put`.
  - Rollback: Redeploy from prior commit. Revocation key remains in KV but is ignored.
- **Documentation impact:**
  - Document `xa:revocation:min_issued_at` KV key and manual revocation procedure in the xa-uploader section of deployment docs.
- **Notes / references:**
  - KV mock pattern established in `route.publish.test.ts:19,81` — reuse `jest.fn()` approach for `getUploaderKv` mock.
- **Build evidence (2026-03-12):**
  - `uploaderAuth.ts:11-12`: added imports for `getUploaderKv` and `uploaderLog`.
  - `uploaderAuth.ts:83-129`: added `isTokenRevokedByTimestamp()` (pure, exported) and `isSessionRevoked()` (async, KV-backed with fail-open).
  - `uploaderAuth.ts:131-155`: `verifySessionToken()` changed from sync to async; calls `isSessionRevoked()` after signature validation.
  - `uploaderAuth.ts:163-172`: added `revokeAllSessions()` export writing current timestamp to KV.
  - `uploaderAuth.test.ts:84-104`: 5 unit tests for `isTokenRevokedByTimestamp()`.
  - `uploaderAuth.test.ts:106-218`: 6 integration tests for KV-backed revocation (reject old, allow new, null KV key, null KV binding, KV error fail-open, wrong version).
  - `uploaderAuth.test.ts:220-252`: 2 tests for `revokeAllSessions()`.
  - Typecheck: pass. Lint: 0 errors.

### TASK-03: Security event logging
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/xa-uploader/src/middleware.ts`, `apps/xa-uploader/src/app/api/uploader/login/route.ts`, `apps/xa-uploader/src/lib/uploaderAuth.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/xa-uploader/src/middleware.ts`, `apps/xa-uploader/src/app/api/uploader/login/route.ts`, `apps/xa-uploader/src/lib/uploaderAuth.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% - `uploaderLog()` exists and is verified at `uploaderLogger.ts`. Adding calls at known locations (middleware deny, login fail, revocation reject) is straightforward.
  - Approach: 90% - Using the existing structured logger is the only sensible approach for an internal admin tool.
  - Impact: 85% - Provides audit trail for security events. Required for observability coverage.
- **Acceptance:**
  - [ ] `uploaderLog("warn", "ip_denied", { ip, path })` emitted in `middleware.ts` when IP check fails.
  - [ ] `uploaderLog("warn", "login_failed", { ip })` emitted in `login/route.ts` when admin token validation fails.
  - [ ] `uploaderLog("warn", "session_revoked", { issuedAt, minIssuedAt })` emitted in `uploaderAuth.ts` when revocation check rejects a token. Note: IP is not available at the auth library level (`hasUploaderSessionFromCookieHeader` receives only a cookie string). IP logging for denied requests is handled at the middleware/route level in TASK-01.
  - [ ] No logging of sensitive values (tokens, secrets, cookie values).
  - [ ] Tests verify log calls are made with correct event names and non-sensitive context.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: N/A - no UX changes
  - Security / privacy: Required - security event logging must not leak sensitive values (tokens, secrets)
  - Logging / observability / audit: Required - primary deliverable of this task
  - Testing / validation: Required - verify log calls via `uploaderLog` mock
  - Data / contracts: N/A - no schema changes; log format follows existing `uploaderLog` JSON-line structure
  - Performance / reliability: N/A - negligible; `uploaderLog` is synchronous console.info/warn/error
  - Rollout / rollback: N/A - logging-only change; no configuration dependency
- **Validation contract (TC-03):**
  - TC-01: middleware denies IP -> `uploaderLog("warn", "ip_denied", ...)` called with IP and request path
  - TC-02: login with wrong admin token -> `uploaderLog("warn", "login_failed", ...)` called with requester IP
  - TC-03: session revoked by min_issued_at -> `uploaderLog("warn", "session_revoked", ...)` called with issuedAt and minIssuedAt (no IP — auth library does not have access to request headers)
  - TC-04: none of the log calls include token values, secret values, or cookie contents
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Add tests that mock `uploaderLog` and verify it is called in each security event scenario.
  - **Green:** Add `uploaderLog()` calls at the three event points: middleware deny path, login failure path, and revocation rejection path. Include only non-sensitive context (IP, path, timestamps).
  - **Refactor:** Consolidate security event type constants if there is duplication.
- **Planning validation:** None: S effort — code locations verified in planning.
- **Scouts:** None: logger seam is verified.
- **Edge Cases & Hardening:**
  - `uploaderLog` already suppresses output in test environment (`NODE_ENV=test`). Tests must mock the function to verify calls.
  - IP extraction returns empty string when proxy trust is disabled. Log will contain `ip: ""` — acceptable, indicates misconfiguration.
- **What would make this >=90%:**
  - Verified that `wrangler tail --format json` correctly parses the structured log output in production.
- **Rollout / rollback:**
  - Rollout: deploy; verify logs appear in `wrangler tail`.
  - Rollback: redeploy prior commit; logging stops.
- **Documentation impact:** None: logging format follows existing `uploaderLog` convention.
- **Notes / references:** None.
- **Build evidence (2026-03-12):**
  - `middleware.ts:4`: added `getRequesterIpFromHeaders` and `uploaderLog` imports.
  - `middleware.ts:37-41`: added `uploaderLog("warn", "ip_denied", { ip, path })` in deny path.
  - `login/route.ts:12`: added `uploaderLog` import.
  - `login/route.ts:72`: added `uploaderLog("warn", "login_failed", { ip: requestIp })` on failed token validation.
  - `uploaderAuth.ts:117`: added `uploaderLog("warn", "session_revoked", { issuedAt, minIssuedAt })` on revocation rejection.
  - No sensitive values logged (no tokens, secrets, or cookie contents).
  - Typecheck: pass. Lint: 0 errors.

### TASK-04: Timing-safe version check fix
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/xa-uploader/src/lib/uploaderAuth.ts`, `apps/xa-uploader/src/lib/__tests__/uploaderAuth.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/xa-uploader/src/lib/uploaderAuth.ts`, `apps/xa-uploader/src/lib/__tests__/uploaderAuth.test.ts`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% - One-line change: replace `version !== "v1"` (line 77) with `!timingSafeEqual(version, "v1")`. The `timingSafeEqual` function already exists in the same file at line 12.
  - Approach: 95% - Standard timing-safe comparison. No alternatives needed.
  - Impact: 85% - Cosmetic security improvement. The version field is not secret, but timing-safe comparison is best practice and eliminates the leak entirely.
- **Acceptance:**
  - [ ] `verifySessionToken()` uses `timingSafeEqual()` for version check instead of `!==`.
  - [ ] Existing tests continue to pass (behavior unchanged — valid/invalid tokens still correctly identified).
  - [ ] New test verifies that a token with wrong version (e.g., `"v2"`) is rejected.
- **Engineering Coverage:**
  - UI / visual: N/A - no UI changes
  - UX / states: N/A - no UX changes
  - Security / privacy: Required - eliminates timing side-channel on version field
  - Logging / observability / audit: N/A - no logging changes
  - Testing / validation: Required - verify wrong-version rejection test
  - Data / contracts: N/A - no schema changes
  - Performance / reliability: N/A - negligible overhead; `timingSafeEqual` is built-in
  - Rollout / rollback: N/A - behavioral equivalence; transparent deploy
- **Validation contract (TC-04):**
  - TC-01: token with version `"v1"` and valid signature -> returns `true`
  - TC-02: token with version `"v2"` and valid signature for that payload -> returns `false`
  - TC-03: existing test suite passes unchanged
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Add test for `"v2"` version rejection (may already pass due to signature mismatch, but makes timing-safe intent explicit).
  - **Green:** Replace `if (version !== "v1") return false;` with `if (!timingSafeEqual(version, "v1")) return false;` at line 77.
  - **Refactor:** None needed — one-line change.
- **Planning validation:** None: S effort — verified `timingSafeEqual` exists at line 12 and `version !== "v1"` is at line 77.
- **Scouts:** None: trivial change.
- **Edge Cases & Hardening:**
  - `timingSafeEqual` with different-length strings: the existing implementation at line 14 returns `false` for different-length buffers, which is correct (e.g., `"v10"` vs `"v1"`).
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: transparent — no configuration changes.
  - Rollback: redeploy prior commit.
- **Documentation impact:** None.
- **Notes / references:** The timing leak is cosmetic — the version field `"v1"` is not secret. But constant-time comparison is best practice for all security-relevant comparisons.
- **Build evidence (2026-03-12):**
  - `uploaderAuth.ts:137`: changed `if (version !== "v1") return false` to `if (!timingSafeEqual(version, "v1")) return false`.
  - `uploaderAuth.test.ts:208-217`: added test for wrong version ("v2") rejection using timing-safe comparison.
  - Typecheck: pass. Lint: 0 errors.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: IP allowlist deny-all + preflight + coherence warning | Partial | [Minor] `preflight-deploy.ts` validates KV namespace ID before checking secrets. TASK-01 builds cleanly but production deploy is also blocked by the KV placeholder until `wrangler.toml:23` is resolved. This is an infrastructure prerequisite shared with TASK-02, not a code issue. | No — deploy blocker is infrastructure, not code. Build proceeds. |
| TASK-02: KV-backed session revocation | Partial | [Minor] KV namespace production ID is a placeholder — must be resolved before deploy, not before build. Build can proceed; deploy is blocked by preflight. | No |
| TASK-03: Security event logging | Yes | None — depends on TASK-01 and TASK-02 being complete so log events have security features to emit for | No |
| TASK-04: Timing-safe version check fix | Yes | None | No |

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Deny-all locks out operator if `XA_UPLOADER_ALLOWED_IPS` secret not provisioned before deploy | Medium | High | Preflight blocks deploy when secret is missing. Rollout checklist requires secret provisioning first. |
| KV namespace placeholder blocks all production deploys | Medium | High | `preflight-deploy.ts` validates KV namespace ID before checking secrets. Both TASK-01 and TASK-02 production deploys are blocked until `wrangler.toml:23` placeholder is resolved. Code changes build cleanly; only deploy is gated. |
| Coherence warning fires but operator does not see it | Low | Medium | Warning is structured JSON via `uploaderLog` — visible in `wrangler tail`. No automatic alerting (monitoring is out of scope). |
| Empty-but-present secret bypasses preflight | Low | Low | Runtime deny-all handles correctly — empty allowlist = deny all. |
| KV read latency degrades session verification | Very Low | Low | Cloudflare KV reads are sub-ms. Fail-open on KV error ensures no availability impact. |

## Observability
- Logging: Security events via `uploaderLog()` — IP denied, login failed, session revoked, coherence mismatch. JSON-line format, visible via `wrangler tail --format json`.
- Metrics: None: internal admin tool with infrequent use. Structured logs provide sufficient signal.
- Alerts/Dashboards: None: monitoring/alerting is out of scope (non-goal).

## Acceptance Criteria (overall)
- [ ] IP allowlist defaults to deny-all when `XA_UPLOADER_ALLOWED_IPS` is unset or empty.
- [ ] `XA_UPLOADER_ALLOWED_IPS` is a required Cloudflare secret enforced by preflight.
- [ ] Session tokens can be revoked via KV-backed minimum-issuedAt mechanism.
- [ ] Security events (IP denied, login failed, session revoked) are logged via `uploaderLog()`.
- [ ] Version check in `verifySessionToken()` uses timing-safe comparison.
- [ ] All tests pass in CI.
- [ ] Existing sessions remain valid until natural expiry or explicit revocation.

## Decision Log
- 2026-03-12: Analysis selected Option B (preflight existence check + runtime coherence warning). No wildcard support — preview environments use explicit IPs. Planning inherits this decision without reopening.
- 2026-03-12: TASK-01 and TASK-02 sequenced in parallel (Wave 1) — no dependencies between IP allowlist hardening and session revocation. TASK-03 (logging) depends on both. TASK-04 (timing) ships last as lowest priority.
- 2026-03-12: KV revocation fail-open tradeoff accepted. For an admin-only tool with infrequent use, availability is preferred over hard-blocking on KV failures. The primary security gap (allow-all default) is closed by TASK-01 independently. Revocation is a secondary hardening measure. If operator requires fail-closed, it requires a code change to the revocation check (changing the catch block from `return true` to `return false`) and redeploy — not a configuration toggle.
- 2026-03-12: Revocation log (`session_revoked`) drops `ip` field. `hasUploaderSessionFromCookieHeader()` receives only a cookie string; IP is not available at the auth library level. IP logging for denied requests is handled at the middleware/route handler level.

## Overall-confidence Calculation
- TASK-01: 85% * M(2) = 170
- TASK-02: 85% * M(2) = 170
- TASK-03: 85% * S(1) = 85
- TASK-04: 90% * S(1) = 90
- Total = (170 + 170 + 85 + 90) / (2 + 2 + 1 + 1) = 515 / 6 = 85.8% -> 85%
