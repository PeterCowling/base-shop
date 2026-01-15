# Security Audit Report - January 2026

**Audit Date:** 2026-01-14
**Auditor:** Claude Opus 4.5
**Scope:** Full repository security assessment
**Previous Audit:** 2026-01-12 (API routes only)

---

## Executive Summary

This comprehensive audit expands on the previous API-focused review to include secrets management, Firebase rules, dependency vulnerabilities, and infrastructure security. The audit identified **3 Critical**, **8 High**, **9 Medium**, and **6 Low** severity issues.

| Severity | Count | Immediate Action Required |
|----------|-------|---------------------------|
| CRITICAL | 3     | Yes - rotate secrets now  |
| HIGH     | 8     | Yes - within 1 week       |
| MEDIUM   | 9     | Yes - within 1 month      |
| LOW      | 6     | Plan for next sprint      |

**Overall Security Grade: B-** (would be A- after addressing critical issues)

---

## Critical Findings

### 1. Hardcoded Secrets Committed to Git

**Severity:** CRITICAL
**Files:**
- `apps/reception/.env.local` - Firebase credentials, Allo password (`jg9BSU5h`)
- `apps/xa/.env.local`, `apps/xa-b/.env.local` - Session secrets
- `apps/shop-secret/.env` - Session secret
- `packages/platform-core/apps/shopx/.env` - Session secret
- `packages/platform-core/apps/shop-env/.env` - Session secret
- `packages/platform-core/apps/shop-env-missing/.env` - Session secret

**Impact:** Anyone with repository access can extract authentication credentials and session secrets.

**Remediation:**
```bash
# 1. Immediately rotate all exposed credentials

# 2. Remove secrets from git history
git filter-repo --invert-paths --path apps/reception/.env.local
git filter-repo --invert-paths --path apps/xa/.env.local
git filter-repo --invert-paths --path apps/xa-b/.env.local
git filter-repo --invert-paths --path apps/shop-secret/.env
git filter-repo --invert-paths --path packages/platform-core/apps/shopx/.env
git filter-repo --invert-paths --path packages/platform-core/apps/shop-env/.env
git filter-repo --invert-paths --path packages/platform-core/apps/shop-env-missing/.env

# 3. Force push (coordinate with team first)
git push --force-with-lease --all

# 4. Update .gitignore
echo ".env*.local" >> .gitignore
```

---

### 2. Firebase Rules: Overly Permissive Root Access

**Severity:** CRITICAL
**File:** `apps/prime/firebase-rules-update.json:3-4`

```json
".read": "auth != null || now < 1819007200000",
".write": "auth != null || now < 1819007200000",
```

**Issue:** The timestamp `1819007200000` (July 18, 2027) allows **unauthenticated read/write access to the entire database** until that date. This appears to be a development bypass that was never removed.

**Impact:** Any user can read and write all data without authentication.

**Remediation:**
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

---

### 3. Firebase Rules: Hardcoded Role Index Checks

**Severity:** CRITICAL
**File:** `apps/prime/firebase-rules-update.json:38-39`

**Issue:** Role checking uses hardcoded array indices (`roles/0`, `roles/1`, `roles/2`), creating authorization bypass if roles are stored at different indices or with more than 3 entries.

```json
"root.child('userProfiles').child(auth.uid).child('roles').child('0').val() == 'owner'"
```

**Impact:** Authorization bypass possible if role array structure changes.

**Remediation:** Restructure to use role-based keys instead of array indices:
```json
{
  "roles": {
    "owner": true,
    "developer": true
  }
}
```

---

## High Severity Findings

### 4. Hardcoded Google Apps Script URLs

**Files:**
- `apps/reception/src/services/useBookingEmail.ts:127`
- `apps/reception/src/services/useEmailGuest.ts:36`
- `apps/reception/src/services/alloggiatiService.ts:48`
- `apps/reception/src/components/stats/Statistics.tsx:19`

**Issue:** 6 Google Apps Script deployment IDs (AKfycb*) exposed in source code.

**Remediation:** Move URLs to environment variables and rotate deployment IDs.

---

### 5. Test Authentication Bypass in Production Code

**File:** `apps/cms/src/actions/common/auth.ts:26-29`

```typescript
if (process.env.CMS_TEST_ASSUME_ADMIN === "1") {
  return { user: { role: "admin" } } as AppSession;
}
```

**Issue:** If this environment variable is accidentally set in production, all authentication is bypassed.

**Remediation:** Use conditional compilation to strip test code from production builds:
```typescript
if (process.env.NODE_ENV === 'test' && process.env.CMS_TEST_ASSUME_ADMIN === "1") {
  // Only in test environment
}
```

---

### 6. Rate Limiting Bypass via Header Spoofing

**Files:**
- `apps/cover-me-pretty/src/app/api/ai/pose/route.ts:20-27`
- `apps/cover-me-pretty/src/app/api/ai/segment/route.ts`
- `apps/cover-me-pretty/src/app/api/ai/depth/route.ts`
- `apps/cover-me-pretty/src/app/api/tryon/garment/route.ts:273-275`

**Issue:** User identity for rate limiting derived from `x-forwarded-for` header which clients can spoof.

```typescript
function identity(req: Request): string {
  const xf = req.headers.get('x-forwarded-for') || '';
  if (xf) return xf.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') || 'anon';
}
```

**Remediation:** Use only verified CDN headers; implement server-side session tracking.

---

### 7. Unauthenticated OAuth Callback Handler

**File:** `apps/cms/src/app/api/providers/[provider]/route.ts:12-36`

**Issue:** OAuth callback accepts `code` parameter without verifying caller has permission to connect providers for the shop.

**Remediation:** Add authentication check before processing OAuth callbacks.

---

### 8. Plaintext Password Storage (Demo Code)

**File:** `apps/cover-me-pretty/src/app/api/login/route.ts:22-26`

```typescript
const CUSTOMER_STORE = {
  cust1: { password: "pass1234", role: "customer" },
  admin1: { password: "admin123", role: "admin" },
};
```

**Issue:** Even in demo code, plaintext passwords establish bad patterns.

**Remediation:** Add prominent warnings or use proper hashing.

---

### 9. SSRF Vulnerability in Webhook Forwarding

**File:** `apps/cover-me-pretty/src/app/api/leads/route.ts:68-103`

**Issue:** Forwards to user-configured webhook endpoints without URL validation.

**Remediation:** Implement domain whitelist; validate URLs; use short timeouts.

---

### 10. Cross-Shop Inventory Access

**File:** `apps/cms/src/app/api/data/[shop]/inventory/[sku]/route.ts:11-45`

**Issue:** Admin role check doesn't verify the admin is authorized for the specific shop.

**Remediation:** Add shop-level authorization validation.

---

### 11. Information Disclosure in Error Messages

**File:** `apps/cms/src/app/api/cart/handlers/utils.ts:55-61`

**Issue:** Raw error messages returned to clients can leak implementation details.

**Remediation:** Return generic errors to clients; log details server-side only.

---

## Medium Severity Findings

### 12. Dependency Vulnerabilities (10 packages)

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

**Remediation:** Run `pnpm audit fix` or update dependencies manually.

---

### 13. Content Security Policy Gaps

**File:** `middleware.ts:27-35`

**Current Configuration:**
```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: "'self'",
    baseURI: "'self'",
    objectSrc: "'none'",
    formAction: "'self'",
    frameAncestors: "'none'",
  },
},
```

**Missing Directives:**
- No `script-src` (allows unsafe inline scripts)
- No `style-src`, `img-src`, `font-src` restrictions

**Remediation:** Add explicit CSP directives with nonce-based script loading.

---

### 14. Firebase: Self-Registration with Staff Role

**File:** `apps/prime/firebase-rules-update.json:40`

```json
"auth.uid == $uid && !data.exists() && newData.child('roles').child('0').val() == 'staff'"
```

**Issue:** Users can self-register with "staff" role without admin approval.

**Remediation:** Require admin approval for role assignment.

---

### 15. Missing Rate Limiting on Password Reset

**File:** `apps/cover-me-pretty/src/app/api/password-reset/request/route.ts`

**Issue:** Password reset endpoint has no rate limiting, enabling brute force attacks.

**Remediation:** Add rate limiting (3 requests per 15 minutes per IP).

---

### 16. File Upload Path Validation Incomplete

**File:** `apps/cover-me-pretty/src/app/uploads/[shop]/[filename]/route.ts:12-18`

**Issue:** Path traversal check doesn't account for URL-encoded sequences (`%2e%2e`).

**Remediation:** Decode URL parameters before validation.

---

### 17. CSV Upload MIME Type Fallback

**File:** `apps/cms/src/app/api/upload-csv/[shop]/route.ts:102-119`

**Issue:** Falls back to client-provided MIME type if magic bytes detection fails.

**Remediation:** Require magic bytes detection; reject unknown file types.

---

### 18. IP Extraction from Untrusted Headers

**Files:** Multiple API routes

**Issue:** `x-forwarded-for` header used without validation for logging and rate limiting.

**Remediation:** Only use verified CDN headers (e.g., `cf-connecting-ip` with Cloudflare).

---

### 19. Cart Operations Lack Session Validation

**File:** `apps/cms/src/app/api/cart/route.ts`

**Issue:** Cart operations rely on cookie-based cart ID without customer session validation.

**Remediation:** Add customer session validation for cart modifications.

---

### 20. Production .env Files with Dummy Secrets

**File:** `apps/cms/.env.production`

**Issue:** Named `.env.production` but contains placeholder values, causing confusion.

**Remediation:** Rename to `.env.production.example` or move to documentation.

---

## Low Severity Findings

1. **Missing HSTS preload list submission** - Domain not submitted to preload list
2. **Email enumeration possible** - Timing-based enumeration on auth endpoints
3. **UPS API tracking number not validated** - Format not checked before API call
4. **Content-Type header not checked** - JSON parsing without header validation
5. **Error messages could be more generic** - Some auth failures reveal too much detail
6. **Test fixtures contain session secrets** - Committed for testing purposes

---

## Positive Findings

The codebase demonstrates many security best practices:

- ✅ Webhook signature verification (HMAC with timing-safe comparison)
- ✅ Strong input validation with Zod schemas
- ✅ Password hashing with Argon2
- ✅ Pre-signed URLs for R2 uploads with expiration
- ✅ Comprehensive secrets management documentation (`docs/secrets-management.md`)
- ✅ HSTS with preload flag configured
- ✅ X-Frame-Options, X-Content-Type-Options headers
- ✅ Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy
- ✅ Prisma ORM (no SQL injection risk)
- ✅ Shop name validation (`validateShopName()`)
- ✅ Rate limiting infrastructure in place
- ✅ MFA support for customer accounts

---

## Implementation Plan

### Phase 1: Immediate (This Week)

| Task | Priority | Status |
|------|----------|--------|
| Rotate all exposed secrets (SESSION_SECRET, Firebase, Allo) | P0 | TODO |
| Fix Firebase rules - remove timestamp bypass | P0 | TODO |
| Remove secrets from git history with `git filter-repo` | P0 | TODO |
| Update `.gitignore` to prevent future leaks | P0 | TODO |

### Phase 2: Short-term (2 Weeks)

| Task | Priority | Status |
|------|----------|--------|
| Fix test auth bypass - use conditional compilation | P1 | TODO |
| Add shop-level authorization to inventory endpoints | P1 | TODO |
| Implement rate limiting on password reset | P1 | TODO |
| Fix SSRF in webhook forwarding (domain whitelist) | P1 | TODO |
| Add authentication to OAuth callback handler | P1 | TODO |
| Move Google Apps Script URLs to env vars | P1 | TODO |

### Phase 3: Medium-term (1 Month)

| Task | Priority | Status |
|------|----------|--------|
| Update vulnerable dependencies | P2 | TODO |
| Strengthen CSP directives (add script-src, style-src) | P2 | TODO |
| Fix header-based rate limiting bypass | P2 | TODO |
| Add session validation to cart operations | P2 | TODO |
| Fix Firebase role checking (remove hardcoded indices) | P2 | TODO |
| Sanitize error messages in API responses | P2 | TODO |

### Phase 4: Ongoing

| Task | Frequency |
|------|-----------|
| Implement secrets scanning in CI/CD (TruffleHog/GitGuardian) | Once |
| Run `pnpm audit` for dependency vulnerabilities | Weekly |
| Security-focused code review checklist | Per PR |
| Penetration testing | Quarterly |
| Rotate production secrets | Every 90 days |

---

## Verification Checklist

After implementing fixes, verify:

- [ ] All old secrets have been rotated and new ones deployed
- [ ] Git history no longer contains secrets (`git log -p | grep -i secret`)
- [ ] Firebase rules reject unauthenticated requests
- [ ] `CMS_TEST_ASSUME_ADMIN` has no effect in production builds
- [ ] Rate limiting works correctly on all auth endpoints
- [ ] CSP headers include all required directives
- [ ] `pnpm audit` shows no high/critical vulnerabilities
- [ ] OAuth callbacks require authentication
- [ ] Inventory endpoints validate shop-level permissions

---

## OWASP Top 10 (2021) Compliance

| Risk | Status | Notes |
|------|--------|-------|
| A01: Broken Access Control | ⚠️ Partial | Firebase bypass, cross-shop access |
| A02: Cryptographic Failures | ⚠️ Partial | Secrets in git |
| A03: Injection | ✅ Good | Prisma ORM, Zod validation |
| A04: Insecure Design | ⚠️ Partial | Test auth bypass in prod code |
| A05: Security Misconfiguration | ⚠️ Partial | Firebase rules, CSP gaps |
| A06: Vulnerable Components | ⚠️ Partial | 10 moderate vulns in deps |
| A07: ID & Auth Failures | ⚠️ Partial | Rate limiting bypass, missing auth |
| A08: Software & Data Integrity | ✅ Good | Webhook signature verification |
| A09: Logging & Monitoring | ⚠️ Partial | Limited audit trail |
| A10: SSRF | ⚠️ Partial | Webhook forwarding issue |

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules Documentation](https://firebase.google.com/docs/database/security)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- Internal: `docs/secrets-management.md`

---

**Report Generated:** 2026-01-14
**Previous Review:** 2026-01-12
**Next Review:** 2026-04-14 (Quarterly)

For questions or to report security issues, contact the security team or create a confidential issue in the repository.
