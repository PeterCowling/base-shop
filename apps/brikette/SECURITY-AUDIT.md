# Security Audit Report - Brikette App

**Date:** 2026-01-12
**Auditor:** Automated Security Scan
**Status:** Initial Audit Complete

---

## Executive Summary

A security audit was conducted on the Brikette application using `pnpm audit`. The audit identified **46 vulnerabilities** across dependencies, including critical and high-severity issues.

### Critical Actions Taken

1. ✅ **Updated Next.js** from 15.3.5 → 16.1.1 (fixes CRITICAL RCE vulnerability)
2. ✅ **Enabled test parallelization** for faster CI/CD
3. ✅ **Set up performance budgets** with Lighthouse CI
4. ✅ **Added skip-to-content links** for accessibility

---

## Critical Vulnerabilities (FIXED)

### 1. Next.js RCE Vulnerability ✅ FIXED
- **Severity:** CRITICAL
- **Package:** next
- **Vulnerable versions:** >=15.3.0-canary.0 <15.3.6
- **Patched version:** 16.1.1 (installed)
- **Issue:** Remote Code Execution in React flight protocol
- **Advisory:** [GHSA-9qr9-h5gf-34mp](https://github.com/advisories/GHSA-9qr9-h5gf-34mp)
- **Status:** ✅ RESOLVED

---

## Remaining Vulnerabilities

### Critical (1)

#### 1. form-data - Unsafe Random Function
- **Severity:** CRITICAL
- **Package:** form-data
- **Path:** `.>cypress>@cypress/request>form-data`
- **Vulnerable versions:** >=4.0.0 <4.0.4
- **Patched versions:** >=4.0.4
- **Issue:** Uses unsafe random function for choosing boundary
- **Advisory:** [GHSA-fjxv-7rqg-78g4](https://github.com/advisories/GHSA-fjxv-7rqg-78g4)
- **Impact:** LOW (dev dependency only, used in Cypress)
- **Recommendation:** Update Cypress to latest version

---

### High Severity (6+)

#### 1. axios - Server-Side Request Forgery
- **Package:** axios
- **Path:** `apps__brikette>bundlesize>github-build>axios`
- **Vulnerable versions:** >=1.3.2 <=1.7.3
- **Patched versions:** >=1.7.4
- **Impact:** MEDIUM (dev dependency in bundlesize package)
- **Recommendation:** Replace bundlesize with modern alternative

#### 2. axios - DoS Attack
- **Package:** axios
- **Path:** Multiple (indirect dependencies)
- **Issue:** Vulnerable to DoS through lack of data size check
- **Impact:** MEDIUM
- **Recommendation:** Update all axios instances

#### 3. semver - ReDoS Vulnerability
- **Package:** semver
- **Path:** `.>cypress-audit>pa11y>semver`
- **Vulnerable versions:** >=7.0.0 <7.5.2
- **Patched versions:** >=7.5.2
- **Impact:** LOW (dev dependency only)
- **Recommendation:** Update cypress-audit

#### 4. path-to-regexp - Backtracking RegExp
- **Package:** path-to-regexp
- **Path:** `.>@cloudflare/next-on-pages>vercel>@vercel/node>path-to-regexp`
- **Vulnerable versions:** >=4.0.0 <6.3.0
- **Patched versions:** >=6.3.0
- **Impact:** MEDIUM
- **Recommendation:** Update @cloudflare/next-on-pages

#### 5. linkifyjs - Prototype Pollution & XSS
- **Package:** linkifyjs
- **Path:** `packages__ui>@tiptap/extension-link>linkifyjs`
- **Vulnerable versions:** <4.3.2
- **Patched versions:** >=4.3.2
- **Impact:** HIGH (if TipTap is used for user input)
- **Recommendation:** Update @tiptap/extension-link

#### 6. lodash.set - Prototype Pollution
- **Package:** lodash.set
- **Path:** `.>cypress-audit>lighthouse>lodash.set`
- **Vulnerable versions:** >=3.7.0 <=4.3.2
- **Patched versions:** None (package deprecated)
- **Impact:** LOW (dev dependency only)
- **Recommendation:** Update lighthouse or remove cypress-audit

---

## Dependency Health

### Outdated Dependencies

The following dependencies should be updated:

```bash
# Check all outdated packages
pnpm outdated --filter @apps/brikette

# Notable updates needed:
- bundlesize: DEPRECATED, replace with @size-limit/preset-app
- cypress-audit: Update to latest
- @cloudflare/next-on-pages: Update to latest (currently 1.13.12)
```

---

## Recommended Actions

### Immediate (P0) - Within 1 Week

1. ✅ **Update Next.js** (COMPLETED)
   ```bash
   pnpm update next@latest --recursive
   ```

2. **Replace bundlesize with size-limit**
   ```bash
   pnpm remove -D bundlesize --filter @apps/brikette
   pnpm add -D @size-limit/preset-app --filter @apps/brikette
   ```

3. **Update @tiptap packages** (if used)
   ```bash
   pnpm update @tiptap/extension-link --recursive
   ```

### Short-term (P1) - Within 2 Weeks

4. **Update Cypress and related packages**
   ```bash
   pnpm update cypress cypress-audit --recursive
   ```

5. **Update @cloudflare/next-on-pages**
   ```bash
   pnpm update @cloudflare/next-on-pages --recursive
   ```

6. **Audit and update all axios dependencies**
   ```bash
   pnpm update axios --recursive
   ```

### Medium-term (P2) - Within 1 Month

7. **Set up automated dependency updates**
   - Configure Dependabot or Renovate
   - Weekly security patches
   - Monthly minor version updates

8. **Add security scanning to CI/CD**
   ```yaml
   # .github/workflows/security.yml
   - name: Run security audit
     run: pnpm audit --audit-level=high
   ```

9. **Implement npm audit in pre-commit hooks**
   ```bash
   # Add to .husky/pre-commit or lint-staged
   pnpm audit --audit-level=critical
   ```

---

## CI/CD Security Integration

### GitHub Actions Workflow

Created: `.github/workflows/security-audit.yml`

```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  pull_request:
    paths:
      - 'pnpm-lock.yaml'
      - '**/package.json'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - name: Security audit
        run: pnpm audit --audit-level=high
```

---

## Monitoring & Maintenance

### Weekly Tasks
- [ ] Review `pnpm audit` output
- [ ] Check for critical security advisories
- [ ] Update dependencies with security patches

### Monthly Tasks
- [ ] Review and update all dependencies
- [ ] Check for deprecated packages
- [ ] Review security best practices

### Quarterly Tasks
- [ ] Full security audit with manual review
- [ ] Penetration testing (if applicable)
- [ ] Review access controls and permissions

---

## Environment Variable Security

### Current Exposure

The following environment variables are exposed client-side (`NEXT_PUBLIC_*`):

```typescript
// apps/brikette/src/config/env.ts
NEXT_PUBLIC_SITE_DOMAIN
NEXT_PUBLIC_PUBLIC_DOMAIN
NEXT_PUBLIC_DOMAIN
NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_NOINDEX_PREVIEW
```

### Recommendations

1. **Minimize client exposure**
   - Only expose truly necessary variables
   - Use server-side detection where possible

2. **Rotate any exposed tokens**
   - Check if GA_MEASUREMENT_ID should be public
   - Ensure no API keys are exposed

3. **Add Content Security Policy**
   ```typescript
   // middleware.ts or next.config.js
   headers: {
     'Content-Security-Policy': "default-src 'self'; ..."
   }
   ```

---

## Security Best Practices Checklist

### Implemented ✅
- [x] HTTPS enforced
- [x] Environment variables validated with Zod
- [x] No secrets in git
- [x] TypeScript strict mode enabled
- [x] ESLint security rules
- [x] Automated dependency audits

### To Implement 🔄
- [ ] Content Security Policy headers
- [ ] Rate limiting on API routes
- [ ] Input validation on all forms
- [ ] SQL injection prevention (if using raw queries)
- [ ] XSS protection (DOMPurify for user content)
- [ ] CSRF protection
- [ ] Subresource Integrity (SRI) for CDN resources

---

## Known Risk Acceptances

### Dev Dependencies
Many of the vulnerabilities are in development-only dependencies (Cypress, bundlesize, etc.) and do not affect production builds. These are lower priority but should still be addressed for developer environment security.

### Transitive Dependencies
Some vulnerabilities are in transitive dependencies (dependencies of dependencies) and require upstream package updates. Track these with:
```bash
pnpm why <package-name>
```

---

## Contact & Escalation

For security concerns:
1. Review this document
2. Check GitHub Security Advisories
3. Escalate to security team if needed

**Last Updated:** 2026-01-12
**Next Review:** 2026-02-12

---

## Appendix: Full Audit Output

To run a full audit:
```bash
pnpm audit --audit-level=moderate
```

To generate a detailed JSON report:
```bash
pnpm audit --json > security-audit-full.json
```
