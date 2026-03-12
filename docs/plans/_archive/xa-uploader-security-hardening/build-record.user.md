---
Type: Build-Record
Status: Complete
Domain: Infra
Last-reviewed: "2026-03-12"
Feature-Slug: xa-uploader-security-hardening
Execution-Track: code
Completed-date: "2026-03-12"
artifact: build-record
Build-Event-Ref: docs/plans/xa-uploader-security-hardening/build-event.json
---

# Build Record: XA Uploader Security Hardening

## Outcome Contract

- **Why:** Right now, if someone accidentally deletes the IP allowlist setting, the entire admin tool becomes publicly accessible with no warning. Session tokens also cannot be revoked before their 7-day expiry, meaning a stolen cookie remains valid for up to a week.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** IP allowlist rejects by default when unconfigured; session revocation mechanism exists via KV-backed minimum-issuedAt check; session verification is fully timing-safe.
- **Source:** operator

## What Was Built

**IP allowlist deny-all default (TASK-01):** Changed `accessControl.ts` to return `false` (deny) instead of `true` (allow) when `XA_UPLOADER_ALLOWED_IPS` is unset or empty. Added `XA_UPLOADER_ALLOWED_IPS` to the required Cloudflare secrets array in `uploaderRuntimeConfig.ts` so preflight blocks deploy when the secret is missing. Added a once-per-process coherence warning that fires when the allowlist is configured but `XA_TRUST_PROXY_IP_HEADERS` is disabled (meaning client IPs cannot be extracted). Removed commented-out allowlist entries from `wrangler.toml` vars sections. Updated `.env.example` documentation.

**KV-backed session revocation (TASK-02):** Added `isSessionRevoked()` to `uploaderAuth.ts` that reads `xa:revocation:min_issued_at` from KV and rejects tokens issued before that timestamp. Changed `verifySessionToken()` from sync to async to support the KV read. Added `revokeAllSessions()` export that writes the current timestamp to KV. Extracted `isTokenRevokedByTimestamp()` as a pure exported function for direct unit testing. KV failures fail open with a structured warning log.

**Security event logging (TASK-03):** Added `uploaderLog("warn", "ip_denied", { ip, path })` in middleware deny path. Added `uploaderLog("warn", "login_failed", { ip })` in login route on failed token validation. Revocation rejection logging (`session_revoked`) was added as part of TASK-02. No sensitive values (tokens, secrets, cookies) are logged.

**Timing-safe version check (TASK-04):** Changed `version !== "v1"` to `!timingSafeEqual(version, "v1")` in `verifySessionToken()`. Added test for wrong-version rejection.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter xa-uploader typecheck` | Pass | All types valid |
| `npx eslint <changed-files>` | Pass | 0 errors, 1 pre-existing warning (i18n-exempt hardcoded string) |
| `scripts/validate-engineering-coverage.sh` | Pass | All coverage rows validated |

## Workflow Telemetry Summary

- Feature slug: `xa-uploader-security-hardening`
- Records: 4 (fact-find, analysis, plan, build)
- Total context input bytes: 317,378
- Total artifact bytes: 83,764
- Modules loaded: 5
- Deterministic checks: 6
- Token measurement coverage: 0.0% (no runtime token capture configured)

## Validation Evidence

### TASK-01
- TC-01: `isUploaderIpAllowedByHeaders()` with unset allowlist returns `false` — verified in `accessControl.test.ts:50-55`
- TC-02: `isUploaderIpAllowedByHeaders()` with empty string `""` returns `false` — verified in `accessControl.test.ts:57-62`
- TC-03: Matching IP allowed — verified in `accessControl.test.ts:71-76`
- TC-04: Non-matching IP denied — verified in `accessControl.test.ts:64-69`
- TC-05: Coherence warning logged — verified in `accessControl.test.ts:79-93`
- TC-06: Coherence warning deduplicated — verified in `accessControl.test.ts:109-122`
- TC-07: `XA_UPLOADER_REQUIRED_CF_SECRET_NAMES` includes `"XA_UPLOADER_ALLOWED_IPS"` — verified in `uploaderRuntimeConfig.ts:9`

### TASK-02
- TC-01: Token issued before revocation timestamp rejected — verified in `uploaderAuth.test.ts:113-136`
- TC-02: Token issued after revocation timestamp allowed — verified in `uploaderAuth.test.ts:138-156`
- TC-03: Null KV key falls through — verified in `uploaderAuth.test.ts:158-172`
- TC-04: KV read error fails open with warning log — verified in `uploaderAuth.test.ts:185-206`
- TC-05: `revokeAllSessions()` writes timestamp to KV — verified in `uploaderAuth.test.ts:227-245`
- TC-06: Backward compat (no revocation key) — verified in `uploaderAuth.test.ts:158-172`

### TASK-03
- TC-01: IP denied log — verified in `middleware.ts:37-41`
- TC-02: Login failed log — verified in `login/route.ts:72`
- TC-03: Session revoked log — verified in `uploaderAuth.ts:117` and `uploaderAuth.test.ts:131-135`
- TC-04: No sensitive values in any log calls — verified by code inspection

### TASK-04
- TC-01: Valid v1 token passes — verified in `uploaderAuth.test.ts:63-82`
- TC-02: Wrong version v2 rejected — verified in `uploaderAuth.test.ts:208-217`
- TC-03: Existing test suite passes unchanged — typecheck pass

## Engineering Coverage Evidence
| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A: no UI changes | Admin tool middleware/library layer only |
| UX / states | N/A: no UX changes | Requests are denied/allowed at middleware level |
| Security / privacy | Pass: deny-all default, preflight enforcement, session revocation, coherence warning, timing-safe comparison | Primary purpose of this plan |
| Logging / observability / audit | Pass: ip_denied, login_failed, session_revoked, security_coherence_mismatch events | Uses existing uploaderLog seam |
| Testing / validation | Pass: 11 new/updated tests in accessControl.test.ts, 13 new tests in uploaderAuth.test.ts | All TC contracts satisfied |
| Data / contracts | Pass: new KV key xa:revocation:min_issued_at | Shared KV namespace with deploy flows |
| Performance / reliability | Pass: one KV read per authenticated request, sub-ms per CF SLA, fail-open on KV error | No availability impact |
| Rollout / rollback | Pass: operator must provision XA_UPLOADER_ALLOWED_IPS secret before deploy; preflight blocks if missing; KV namespace ID placeholder must be resolved | Deploy gated by infrastructure prerequisites |

## Scope Deviations

None. All changes were within planned task scope.
