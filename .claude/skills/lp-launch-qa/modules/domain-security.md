# Domain: Security Baseline

**Goal**: Verify site meets OWASP runtime security baseline before launch.
**Required output schema**: `{ domain: "security", status: "pass|fail|warn", checks: [{ id: "<SEC-X>", status: "pass|fail|warn", evidence: "<string>" }] }`

## Site Reachability

If the site URL (from `latest.user.md`) is unreachable, set `status: fail` with `evidence: "site unreachable — security baseline unverified"` for all HTTP checks and stop. An unreachable site means the security baseline was not verified, which is equivalent to a failure.

## Checks

- **SEC-01: HTTPS enforcement**
  - **What:** Verify all HTTP traffic is redirected to HTTPS; check for HSTS header
  - **How:** `curl -sI http://<SITE_URL>` — should return 301/302 to HTTPS; `curl -sI https://<SITE_URL>` — should include `Strict-Transport-Security` header
  - **Pass condition:** HTTP redirects to HTTPS; `Strict-Transport-Security` header present with `max-age` ≥ 31536000
  - **Evidence:** curl -sI output showing redirect status and HSTS header value
  - **Fail condition:** HTTP serves content without redirect; HSTS header absent or `max-age` < 31536000

- **SEC-02: HTTP security headers**
  - **What:** Verify key security response headers are present: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
  - **How:** `curl -sI https://<SITE_URL>` — inspect response headers
  - **Pass condition:** All three headers present with valid values: `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY` or `SAMEORIGIN`; `Referrer-Policy: strict-origin-when-cross-origin` or stricter
  - **Evidence:** curl -sI header output with values for all three headers
  - **Fail condition:** Any of the three headers absent

- **SEC-03: Content Security Policy (CSP)**
  - **What:** Verify `Content-Security-Policy` header is present and non-trivially restrictive
  - **How:** `curl -sI https://<SITE_URL>` — check for `Content-Security-Policy` header
  - **Pass condition:** `Content-Security-Policy` header present; `default-src` or `script-src` does not allow `*`; `unsafe-inline` without nonce/hash is not permitted in `script-src`
  - **Evidence:** CSP header value from curl output
  - **Fail condition:** Header absent; or `default-src *` (wildcard); or both `unsafe-inline` and `unsafe-eval` present in script directives without nonce or hash
  - **Note:** `unsafe-inline` with a nonce or hash is acceptable. The check is fail only on blanket `unsafe-inline` without a nonce/hash constraint.

- **SEC-04: Cookie security flags**
  - **What:** Verify session/auth cookies have `Secure`, `HttpOnly`, and `SameSite` flags set
  - **How:** `curl -sI https://<SITE_URL>` — inspect `Set-Cookie` response headers; check login or checkout flow if homepage sets no cookies
  - **Pass condition:** All session/auth cookies include `Secure; HttpOnly; SameSite=Lax` (or `Strict`)
  - **Evidence:** Set-Cookie header values from curl output; or note if no session/auth cookies are set
  - **Fail condition:** Session or auth cookie missing `Secure` or `HttpOnly` flag; `SameSite=None` without `Secure` flag
  - **Note:** If no cookies are set at all (purely informational site), pass with evidence "no cookies set on this site"

- **SEC-05: Repository secrets exposure**
  - **What:** Scan repository-tracked files for accidentally committed secrets (API keys, credentials, private keys)
  - **How:** `git ls-files | xargs grep -rE "(api_key|apikey|secret|password|credential|private_key|BEGIN (RSA|EC|OPENSSH) PRIVATE|ACCESS_KEY|AUTH_TOKEN)\s*[:=]\s*['\"]?[A-Za-z0-9+/]{20,}" --include="*.ts" --include="*.js" --include="*.env" --include="*.json" --include="*.yaml" --include="*.yml" -l 2>/dev/null | head -20`
  - **Pass condition:** No high-confidence secret patterns found in tracked files; `.env` files containing real values are not tracked (`.gitignore` covers them)
  - **Evidence:** "No secrets found in tracked files" — or list of suspected files for manual review
  - **Fail condition:** High-confidence secret pattern found in a tracked file; or `.env` file with real credentials tracked in git
  - **Note:** This check covers repository-level secrets only. Build artifact scanning (CI TruffleHog pipeline) is separate.

- **SEC-06: Auth hardening**
  - **What:** Verify that authenticated routes require authentication; check that login endpoints respond to repeated failures (rate limiting / lockout)
  - **How:** Attempt to access known private/authenticated routes without auth; check login endpoint headers for rate-limiting signals (`X-RateLimit-*`, `Retry-After`, `429` response)
  - **Pass condition:** Private routes redirect to login or return 401/403 when unauthenticated; login endpoint returns `429` after repeated failures (or has documented rate limiting via WAF/CDN)
  - **Evidence:** HTTP status code of private route without auth; login endpoint behavior summary
  - **Fail condition:** Private route serves authenticated content without any authentication challenge
  - **Note:** If site has no authentication (informational/static site), pass with evidence "no authentication required for this site type". Missing rate-limiting alone (when route auth protection is correct) is a `status: warn`, not fail.

- **SEC-07: CORS policy**
  - **What:** Verify that API endpoints do not return wildcard `Access-Control-Allow-Origin: *` on sensitive or authenticated routes
  - **How:** `curl -sI -X OPTIONS -H "Origin: https://evil-origin.example.com" https://<SITE_URL>/api/` (or representative API endpoint) — inspect `Access-Control-Allow-Origin` header
  - **Pass condition:** API endpoints restrict `Access-Control-Allow-Origin` to known origins; wildcard `*` only acceptable on public static assets
  - **Evidence:** CORS header value on tested API endpoints
  - **Fail condition:** `Access-Control-Allow-Origin: *` returned on an authenticated API endpoint or endpoint that returns user data
  - **Note:** If site has no API endpoints (static/informational only), pass with evidence "no API endpoints requiring CORS restrictions"

- **SEC-08: Dependency CVE check**
  - **What:** Verify no high or critical CVEs in the app's production dependencies
  - **How:** `pnpm audit --audit-level=high` — exits 0 if no high/critical CVEs; or reference the CI security-audit job status (after TASK-05 CI gate is live)
  - **Pass condition:** pnpm audit exits 0 with no high/critical CVEs
  - **Evidence:** pnpm audit output summary (or CI audit job pass confirmation)
  - **Fail condition:** High or critical CVE present in production dependencies
  - **Note:** Moderate/low CVEs result in `status: warn` for this check, not fail. Domain `status: fail` only when high/critical CVEs are present.

## Domain Pass Criteria

| Check | Fail triggers domain fail? | Warn condition |
|---|---|---|
| SEC-01 (HTTPS) | Yes — any fail | None |
| SEC-02 (Security headers) | Yes — any header absent | None |
| SEC-03 (CSP) | Yes — header absent or wildcard | None |
| SEC-04 (Cookie flags) | Yes — Secure/HttpOnly missing | None |
| SEC-05 (Repo secrets) | Yes — tracked secret found | Suspected patterns needing review |
| SEC-06 (Auth hardening) | Yes — unauthenticated access to private route | Missing rate-limiting when auth is otherwise correct |
| SEC-07 (CORS) | Yes — wildcard on authenticated API | None |
| SEC-08 (CVEs) | Yes — high/critical CVE | Moderate/low CVEs |

- Site unreachable at check time → all HTTP checks → `status: fail`; domain `status: fail`
- All checks pass → domain `status: pass`
- Only `warn`-level findings, no fails → domain `status: warn` (non-blocking, noted in QA report)
