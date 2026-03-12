---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Infra
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-security-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/xa-uploader-security-hardening/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312150000-C006
Trigger-Why:
Trigger-Intended-Outcome:
---

# XA Uploader Security Hardening Fact-Find Brief

## Scope

### Summary

The XA uploader admin tool has security weaknesses in its access control layer. The most critical is the IP allowlist defaulting to allow-all when the `XA_UPLOADER_ALLOWED_IPS` environment variable is missing — meaning a misconfigured deployment silently exposes the full catalog admin API to the internet. A secondary gap is the absence of any session token revocation mechanism (7-day token lifetime, no early invalidation). Two additional findings (timing leak on version check, Content-Length bypass) were investigated and classified as LOW and NON-ISSUE respectively.

### Goals

- Change IP allowlist default from allow-all to deny-all when `XA_UPLOADER_ALLOWED_IPS` is unset or empty.
- Add allowlist/proxy-trust coherence validation. Note: `XA_UPLOADER_ALLOWED_IPS` is currently treated as a secret (set via `wrangler secret put`), but `preflight-deploy.ts` can only list secret names, not read values. The coherence check must either: (a) check only for the secret's existence (not its value), or (b) move `XA_UPLOADER_ALLOWED_IPS` to non-secret `[vars]` in `wrangler.toml` so the preflight can read it, or (c) add a runtime coherence check in `accessControl.ts` at first invocation. The analysis stage should evaluate these options.
- Implement KV-backed session revocation via a minimum-issuedAt timestamp mechanism.
- Cosmetic fix for non-constant-time version check in session verification.

### Non-goals

- Replacing the in-memory rate limiter with a distributed (KV-backed) rate limiter. Accepted as P2 for now.
- Modifying Content-Length handling — current dual-check implementation is correct.
- Removing `unsafe-inline` from CSP — acceptable for an internal admin tool.
- Adding brute-force alerting or monitoring — deferred.

### Constraints & Assumptions

- Constraints:
  - KV namespace (`XA_UPLOADER_KV`) is bound in `wrangler.toml` but the production namespace ID is still a placeholder (`REPLACE_WITH_PROD_NS_ID` at `wrangler.toml:23`). The preflight deploy script (`preflight-deploy.ts`) would catch this, but the KV namespace must be created and the ID replaced before revocation features can deploy.
  - Changes must be backward-compatible with existing session cookies (new tokens can include revocation-compatible fields; old tokens expire naturally).
  - Cloudflare Workers runtime: Node.js compat mode, no filesystem access.
- Assumptions:
  - `XA_UPLOADER_ALLOWED_IPS` is not currently set as a Cloudflare secret in production (wrangler.toml has it commented out). If it is set, the allow-all default is not currently exposed, but remains a latent risk.
  - Reducing session max age from 7 days to a shorter window (e.g. 24h) is acceptable for an admin tool with infrequent use.

## Outcome Contract

- **Why:** Right now, if someone accidentally deletes the IP allowlist setting, the entire admin tool becomes publicly accessible with no warning. Session tokens also cannot be revoked before their 7-day expiry, meaning a stolen cookie remains valid for up to a week.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** IP allowlist rejects by default when unconfigured; session revocation mechanism exists via KV-backed minimum-issuedAt check; session verification is fully timing-safe.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/middleware.ts` — Ingress gate: runs IP allowlist check on every request (matcher excludes only static assets). Applies security headers (CSP, HSTS, X-Frame-Options, etc.).
- `apps/xa-uploader/src/app/api/uploader/login/route.ts` — Login endpoint: validates admin token, issues session cookie. Performs redundant IP allowlist check.
- `apps/xa-uploader/src/app/api/uploader/session/route.ts` — Session check endpoint with redundant IP allowlist check.

### Key Modules / Files

| File | Role |
|---|---|
| `apps/xa-uploader/src/lib/accessControl.ts` | IP allowlist parsing (`parseAllowlistedIps`) and enforcement (`isUploaderIpAllowedByHeaders`). 30 LOC. |
| `apps/xa-uploader/src/lib/uploaderAuth.ts` | Session token issuance (`issueSessionToken`), verification (`verifySessionToken`), admin token validation (`validateUploaderAdminToken`), cookie management. 133 LOC. |
| `apps/xa-uploader/src/lib/requestJson.ts` | JSON body parsing with dual size-limit enforcement (header fast-reject + actual byte count). 33 LOC. |
| `apps/xa-uploader/src/lib/requestIp.ts` | Trusted IP extraction from proxy headers (`cf-connecting-ip` > `x-forwarded-for` > `x-real-ip`). Respects `XA_TRUST_PROXY_IP_HEADERS` toggle. 97 LOC. |
| `apps/xa-uploader/src/lib/rateLimit.ts` | In-memory per-Worker-isolate rate limiting with LRU pruning. 116 LOC. |
| `apps/xa-uploader/src/middleware.ts` | Ingress middleware: IP gate + security headers. 43 LOC. |
| `apps/xa-uploader/src/lib/uploaderLogger.ts` | Structured JSON logger used by xa-uploader. Existing seam for security event logging. 51 LOC. |
| `apps/xa-uploader/scripts/preflight-deploy.ts` | Deploy preflight checks: validates KV namespace ID, required Cloudflare secrets. Correct seam for allowlist/proxy-trust coherence validation. |
| `apps/xa-uploader/wrangler.toml` | Production config: KV namespace binding (`XA_UPLOADER_KV`, placeholder ID), `XA_UPLOADER_ALLOWED_IPS` commented out. |
| `.github/workflows/xa.yml` | CI/CD workflow for xa-uploader: tests, preflight, deploy. Tests run in standalone workflow (not reusable). |

### Patterns & Conventions Observed

- Security headers applied via middleware to every response — pattern: `applySecurityHeaders()` in `middleware.ts:20-25`.
- Session tokens are self-contained HMAC-signed payloads (format: `v1.<issuedAt>.<nonce>.<signature>`) — no server-side session store.
- Cookie configuration uses httpOnly + sameSite strict + secure (in prod) + path "/" — evidence: `uploaderAuth.ts:115-121`.
- Dual-layer IP check: middleware (all routes) + login route (redundant) — pattern seen in `middleware.ts:35` and login `route.ts`.
- Rate limiting is per-Worker-isolate with global `Map` — evidence: `rateLimit.ts:20-31`.

### Data & Contracts

- Types/schemas/events:
  - `RateLimitEntry`: `{ count, resetAt, lastSeenAt }` — internal to `rateLimit.ts`.
  - `RateLimitResult`: `{ allowed, remaining, resetAt, retryAfter, limit }` — returned by `rateLimit()`, consumed by `withRateHeaders()`.
  - Session token format: `v1.<issuedAt>.<nonce>.<base64url-hmac-sha256>` — string, no typed schema.
- Persistence:
  - Session state: cookie-only (no server-side store). Cookie name: `xa_uploader_admin`.
  - Rate limit state: in-memory `Map` per Worker isolate. Lost on isolate restart.
  - KV namespace `XA_UPLOADER_KV`: actively used for deploy cooldown/pending-state flows (`deployHook.ts:508-593`, exercised by sync, publish, and deploy-drain routes) as well as sync mutex operations. Available for session revocation but shares namespace with existing operational data.
- API/contracts:
  - Login: `POST /api/uploader/login` — accepts `{ token: string }`, returns session cookie.
  - Session check: `GET /api/uploader/session` — returns `{ authenticated: boolean }`.
  - Logout: `POST /api/uploader/logout` — clears session cookie.

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/lib` — `toPositiveInt` used by rate limiter.
  - Cloudflare Workers runtime — `nodejs_compat` flag for `crypto` module.
  - KV namespace (`XA_UPLOADER_KV`) — already bound, used for sync mutex.
- Downstream dependents:
  - All catalog API routes depend on middleware IP gate.
  - Login/session routes depend on `uploaderAuth.ts` and `accessControl.ts`.
  - UI components rely on session cookie for authenticated state.
- Likely blast radius:
  - Changing the allow-all default affects every request to the app when the env var is missing. Must be coordinated with env var configuration.
  - Adding KV-based revocation adds a KV read to every authenticated request via `verifySessionToken`. Latency impact is minimal (KV reads are sub-ms in Cloudflare).

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (via `@acme/jest-config`)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs`
- CI integration: tests run in standalone `.github/workflows/xa.yml` workflow (not the reusable workflow pattern)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| IP allowlist parsing | Unit | `accessControl.test.ts` | 6 tests: IP parsing, proxy trust, allowlist enforcement. Explicitly tests allow-all default (line 38-43). |
| Session auth | Unit | `uploaderAuth.test.ts` | Tests for vendor mode and session roundtrip. |
| Request JSON | Unit | `requestJson.test.ts` | Implicitly tested via route tests. |
| IP extraction | Unit | `requestIp.test.ts` | Tests for IPv4/IPv6 parsing and proxy header trust. |
| Rate limiting | Unit | `rateLimit.test.ts` | Tests for rate limit enforcement and pruning. |
| Middleware | Unit | `middleware.test.ts` | Tests for IP gate and security headers. |
| Login route | Integration | `login/route.test.ts` | Tests for login flow. |
| Session route | Integration | `session/route.test.ts` | Tests for session check. |
| Logout route | Integration | `logout/route.test.ts` | Tests for logout flow. |

#### Coverage Gaps

- Untested paths:
  - No test for deny-all behavior when allowlist is empty (current test asserts allow-all as correct).
  - No test for expired session token rejection.
  - No test for revocation flow (does not exist yet).
  - No test for coherence validation between allowlist and proxy trust settings.
- Extinct tests: None identified.

#### Testability Assessment

- Easy to test:
  - Deny-all default: modify `accessControl.test.ts` to assert `false` when env var is unset.
  - Session expiry: mock `Date.now()` in `uploaderAuth.test.ts`.
  - KV revocation: mock KV get/put in new test.
- Hard to test:
  - In-memory rate limit reset on Worker restart (runtime behavior, not unit-testable).
- Test seams needed:
  - KV namespace access needs to be injectable for testing (dependency injection or mock).

#### Recommended Test Approach

- Unit tests for: deny-all default, expired token rejection, KV revocation check, allowlist+proxy-trust coherence validation.
- Integration tests for: login flow with deny-all default, revocation invalidation of existing sessions.
- E2E tests for: N/A (admin tool, no Cypress/Playwright coverage).
- Contract tests for: N/A.

### Recent Git History (Targeted)

- `9941c5fad1` — `feat(xa): harden staging publish and security flows` — recent security hardening pass.
- `09ba976e0d` — `Migrate xa-uploader middleware to proxy` — middleware refactoring.
- `bd1c895da5` — `add dedicated xa-uploader login route` — login route added.
- `284e413e73` — `harden xa anti-copy controls for free tier` — anti-copy security controls.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | Admin tool; no UI changes in scope. | None | None |
| UX / states | N/A | No user-facing state changes; error responses already return 404 (stealth). | None | None |
| Security / privacy | Required | IP allowlist defaults to allow-all (`accessControl.ts:21`); session tokens are HMAC-signed with 7-day TTL, no revocation; timing-safe comparison used for signature but version check is non-constant-time; strong CSP and cookie settings. | P0: deny-all default missing. P1: no revocation mechanism. P3: timing leak on version check. | All three security gaps carry forward. |
| Logging / observability / audit | Required | Existing structured logger at `uploaderLogger.ts` (JSON-line via `uploaderLog()`). No security events currently logged — denied IP requests and failed logins are silent. Rate limiter exposes headers but no server-side logging. | No audit trail for security events (failed logins, denied IPs, revocations). | Add security event logging via existing `uploaderLog()` seam. |
| Testing / validation | Required | 46+ test files across the app; security-specific tests exist for access control, auth, rate limiting, IP parsing. | Missing: deny-all default test, expired token test, revocation test, coherence validation test. | New tests needed for each security change. |
| Data / contracts | Required | Session token format: `v1.<issuedAt>.<nonce>.<sig>`. KV namespace available. | New KV key needed for revocation timestamp. Token format unchanged (issuedAt already present). | KV revocation key schema. |
| Performance / reliability | Required | KV reads are sub-ms in Cloudflare. In-memory rate limiter has LRU pruning. | Adding KV read to every authenticated request. Negligible latency. | Confirm KV read caching strategy. |
| Rollout / rollback | Required | Deployed via Cloudflare Workers (`wrangler deploy`) through `.github/workflows/xa.yml`. Preflight script validates secrets before deploy. | Deny-all default is a breaking change if env var is not set before deploy. Must coordinate env var configuration with deploy. KV namespace production ID is a placeholder. | Env var must be set before deploying deny-all default. Add allowlist coherence check to preflight. Rollback: redeploy prior commit. |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Four findings were investigated; one is a non-issue (Content-Length), one is cosmetic (timing leak), leaving two substantive changes (deny-all default, KV revocation) plus supporting work (preflight validation, security event logging). Implementation touches approximately 7 files (`accessControl.ts`, `uploaderAuth.ts`, `middleware.ts`, `uploaderLogger.ts`, `preflight-deploy.ts`, `wrangler.toml`, `logout/route.ts`) plus their test files. The KV namespace binding has a placeholder production ID that must be resolved before revocation features deploy. The scope is well-bounded and does not require external research or new infrastructure beyond the existing KV namespace.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| IP allowlist logic (`accessControl.ts`) | Yes | None | No |
| Session auth (`uploaderAuth.ts`) | Yes | None | No |
| Request body parsing (`requestJson.ts`) | Yes | None — confirmed non-issue | No |
| IP extraction (`requestIp.ts`) | Yes | None | No |
| Rate limiting (`rateLimit.ts`) | Yes | None | No |
| Middleware integration (`middleware.ts`) | Yes | None | No |
| KV namespace availability (`wrangler.toml`) | Partial | [Scope gap] [Minor]: Production KV namespace ID is a placeholder. Binding exists but ID must be replaced before revocation deploy. | No (documented in Constraints) |
| Deploy preflight (`preflight-deploy.ts`) | Yes | None — identified as correct seam for coherence validation | No |
| CI workflow (`.github/workflows/xa.yml`) | Yes | None — standalone workflow confirmed | No |
| Structured logger (`uploaderLogger.ts`) | Yes | None — existing seam for security event logging | No |
| Test landscape coverage | Yes | [Scope gap] [Minor]: Verified gaps exist (deny-all default, expired token, revocation, coherence) — documented in Coverage Gaps section. No missing scope areas. | No (gaps documented) |
| Env var coordination (allowlist + proxy trust) | Yes | None — interaction documented in Finding 1 | No |

## Questions

### Resolved

- Q: Is `XA_UPLOADER_ALLOWED_IPS` set as a Cloudflare production secret?
  - A: Unknown, but the wrangler.toml has it commented out. Regardless, the allow-all default is a latent risk that should be fixed. The deny-all default protects against future misconfiguration regardless of current state.
  - Evidence: `wrangler.toml` — env var commented out.

- Q: Should max session age be reduced from 7 days?
  - A: Recommended but deferred to operator decision. Current 7-day TTL is generous for an admin tool. Reducing to 24h would limit blast radius but changes operator workflow (more frequent re-login). The login flow has no refresh mechanism — `uploaderAuth.ts:91-111` issues a one-shot token with no renewal path. Moving to Open Questions for operator input.
  - Evidence: Session max age constant at `uploaderAuth.ts:6` (`SESSION_MAX_AGE_SECONDS = 604800`); no refresh token mechanism.

- Q: Should the login endpoint return 404 (stealth) or 401 for bad credentials?
  - A: Keep current behavior (401 with `{ error: "unauthorized" }` for login, 404 for denied IPs). The middleware already returns 404 for denied IPs, which is correct stealth posture. Login 401 is standard and does not leak information about the existence of the endpoint since it is only reachable after passing the IP gate.
  - Evidence: `middleware.ts:27-31` returns 404 for denied IPs; login route returns 401.

- Q: Is there monitoring for failed login attempts?
  - A: No alerting exists. Rate limiter caps at configurable attempts per window per IP but has no logging or alerting. Accepted as deferred work — adding security event logging is included in scope but a full monitoring/alerting system is not.
  - Evidence: `rateLimit.ts` — pure rate limiting, no logging callback.

### Open (Operator Input Required)

- Q: Should max session age be reduced from 7 days, and if so to what value?
  - Why operator input is required (not agent-resolvable): There is no refresh token mechanism — reducing TTL directly changes how often the operator must re-login. This is a workflow preference that depends on operator usage patterns.
  - Decision impacted: `SESSION_MAX_AGE_SECONDS` value in `uploaderAuth.ts`.
  - Decision owner: operator
  - Default assumption (if any) + risk: Keep at 7 days with KV revocation as the primary safety mechanism. Risk: longer exposure window for stolen tokens, mitigated by revocation capability.

- Q: What IP addresses should be in the production allowlist?
  - Why operator input is required (not agent-resolvable): Only the operator knows which IPs they access the admin tool from.
  - Decision impacted: The value of `XA_UPLOADER_ALLOWED_IPS` to set before deploying the deny-all default.
  - Decision owner: operator
  - Default assumption (if any) + risk: Deploy deny-all default first, then operator sets allowed IPs via `wrangler secret put XA_UPLOADER_ALLOWED_IPS`. Risk: brief lockout window between deploy and secret configuration, mitigated by setting the secret before deploying.

## Confidence Inputs

- **Implementation:** 90% — All affected files are small (30-133 LOC), well-structured, and have existing test coverage. The KV namespace is already bound. Evidence: file sizes and test landscape documented above.
  - To reach >=90: already there.

- **Approach:** 85% — Deny-all default and KV-backed revocation are standard security patterns. The minimum-issuedAt approach is simple and proven. Evidence: KV namespace available, session token already contains `issuedAt`.
  - To reach >=90: confirm KV read latency is acceptable in production via a simple benchmark (expected sub-ms).

- **Impact:** 85% — Fixes the highest-risk security gap (allow-all default) and adds a missing capability (revocation). Low risk of regression since changes are additive guards. Evidence: existing test suite, cookie security posture is strong.
  - To reach >=90: confirm `XA_UPLOADER_ALLOWED_IPS` production state.

- **Delivery-Readiness:** 80% — Medium scope (~7 source files plus tests), clear implementation path, existing tests to extend. Two blockers: operator must provide production IP list before deploy; KV namespace production ID placeholder must be resolved before revocation features deploy.
  - To reach >=90: operator confirms production allowlist IPs; KV namespace created and ID replaced in `wrangler.toml`.

- **Testability:** 90% — All changes are unit-testable. KV interaction is mockable. Rate limiter is already tested. Evidence: existing test patterns in `accessControl.test.ts`, `uploaderAuth.test.ts`.
  - To reach >=90: already there.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Deny-all default locks out admin if env var not configured before deploy | Medium | High | Set `XA_UPLOADER_ALLOWED_IPS` secret before deploying. Add clear startup error log. |
| Allowlist + proxy trust misconfiguration locks out all users | Low | Medium | Add coherence check to `preflight-deploy.ts`: if allowlist is non-empty and proxy trust is disabled, fail preflight. |
| KV namespace production ID is placeholder | Medium | High | `wrangler.toml:23` has `REPLACE_WITH_PROD_NS_ID`. Must create namespace and replace before revocation features deploy. Preflight script validates this. |
| KV read latency on every authenticated request | Very Low | Low | Cloudflare KV reads are sub-ms. Can add in-memory cache with short TTL if needed. |
| Stolen session cookie valid until revocation timestamp is updated | Low | Medium | Revocation reduces window from 7 days to operator response time. Reducing TTL to 24h further limits exposure. |
| In-memory rate limiter resets on Worker restart | Medium | Low | Accept for now. Attacker gets fresh attempts after restart but still faces per-isolate limits. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Maintain backward compatibility with existing session cookies during transition.
  - Use existing KV namespace (`XA_UPLOADER_KV`) for revocation — no new infrastructure.
  - Follow existing test patterns in `apps/xa-uploader/src/lib/__tests__/`.
- Rollout/rollback expectations:
  - Set `XA_UPLOADER_ALLOWED_IPS` secret before deploying deny-all default.
  - Enable `XA_TRUST_PROXY_IP_HEADERS=1` when allowlist is active (Cloudflare deployments always need this).
  - Rollback: redeploy previous Worker version via `wrangler deploy` from the prior commit (the standard XA deploy path in `.github/workflows/xa.yml`).
- Observability expectations:
  - Log denied IP requests (currently silent 404).
  - Log revocation events (timestamp updates in KV).
  - Log failed login attempts with rate-limit context.

## Suggested Task Seeds (Non-binding)

1. Change `isUploaderIpAllowedByHeaders` to return `false` when allowlist is empty; add allowlist/proxy-trust coherence check to `preflight-deploy.ts`; update tests.
2. Add KV-backed `minimum_valid_issued_at` revocation to `verifySessionToken`; add revocation write endpoint; resolve KV namespace placeholder ID; update tests.
3. Reduce `SESSION_MAX_AGE_SECONDS` from 7 days (operator decision on target value — see Open Questions).
4. Fix timing leak: compute signature before version check in `verifySessionToken`.
5. Add security event logging via existing `uploaderLog()` for denied IPs, failed logins, and revocation events.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - All existing tests pass with updated assertions.
  - New tests for deny-all default, revocation flow, expired token rejection, coherence validation.
  - Typecheck clean (`pnpm typecheck`).
  - Lint clean (`pnpm lint`).
- Post-delivery measurement plan:
  - Verify deny-all default blocks requests when env var is unset (test evidence).
  - Verify KV revocation invalidates existing sessions (test evidence).
  - If session TTL reduced: verify new max age (test evidence).

## Evidence Gap Review

### Gaps Addressed

- Verified all file paths and code claims against actual repository state.
- Confirmed IP allowlist allow-all behavior at `accessControl.ts:21` (line numbers match).
- Confirmed session token format and verification logic at `uploaderAuth.ts:73-88`.
- Confirmed Content-Length dual-check at `requestJson.ts:10-21` (non-issue verified).
- Confirmed KV namespace binding in `wrangler.toml:21-23`.
- Confirmed test coverage via glob of 46+ test files in xa-uploader.

### Confidence Adjustments

- No downward adjustments needed. All code claims verified.
- Implementation confidence stays at 90% (small, well-structured changes).

### Remaining Assumptions

- Production state of `XA_UPLOADER_ALLOWED_IPS` as a Cloudflare secret is unknown but does not block planning (deny-all default is correct regardless).
- KV read latency assumed sub-ms based on Cloudflare documentation (not benchmarked in this environment).

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis`
