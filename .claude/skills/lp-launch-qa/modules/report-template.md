# Launch QA Report Template

Write report to:
```
docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md
```

## Report structure

```markdown
---
Type: Launch QA Report
Business-Unit: <BIZ>
Audit-Date: YYYY-MM-DD
Deployment-Target: <staging | production>
Deployment-URL: <URL>
Domains-Audited: <conversion, seo, performance, legal, measurement | all>
Decision: <GO | NO-GO>
---

# Launch QA Report — <Business Name>

## Executive Summary

**Audit Date:** YYYY-MM-DD
**Deployment Target:** <staging/production>
**Deployment URL:** <URL>
**Decision:** <GO | NO-GO>

**Results:**
- Conversion: X/Y passed (<% pass rate>)
- SEO: X/Y passed (<% pass rate>)
- Performance: X/Y passed (<% pass rate>)
- Legal: X/Y passed (<% pass rate>)
- Brand Copy: X/Y passed (<% pass rate>) | _or_ Skipped — Brand Dossier absent
- Measurement: X/Y passed (<% pass rate>) | _or_ Gap advisory — S1B not run

**Blockers:** <count> | **Warnings:** <count>

---

## Cross-Domain Analysis

<Synthesized findings from comparing all 6 domain verdicts. Document:>
- Cross-domain failure patterns (e.g., analytics not firing may indicate both a Conversion failure AND a Measurement failure)
- Conflicting signals between domains
- Shared root causes across multiple domain failures

---

## Domain 1: Conversion QA

### C1: Primary conversion flow submits successfully
- **Status:** <PASS | FAIL>
- **Evidence:** <screenshot link or inline description>
- **Notes:** <any deviations or observations>

### C2: Conversion analytics event fires
- **Status:** <PASS | FAIL>
- **Evidence:** <network log screenshot or event payload snippet>
- **Notes:** <any deviations or observations>

<... continue for all Conversion checks ...>

---

## Domain 2: SEO Technical Readiness

### S1: Sitemap exists and is valid
- **Status:** <PASS | FAIL>
- **Evidence:** <sitemap URL + XML snippet + URL count>
- **Notes:** <any deviations or observations>

<... continue for all SEO checks ...>

---

## Domain 3: Performance Budget

### P1: Core Web Vitals (Lighthouse)
- **Status:** <PASS | FAIL>
- **Evidence:** <Lighthouse report summary + metrics>
- **Notes:** <any deviations or observations>

<... continue for all Performance checks ...>

---

## Domain 4: Legal Compliance

### L1: Cookie consent banner present (EU visitors)
- **Status:** <PASS | FAIL>
- **Evidence:** <screenshot + network tab snippet>
- **Notes:** <any deviations or observations>

<... continue for all Legal checks ...>

---

## Domain 5: Brand Copy Compliance

<_Skip this section if brand-dossier.user.md is absent. All Domain 5 failures are Warnings (GATE-BD-06b)._>

### BC-04: Words to Avoid
- **Status:** <PASS | WARN | SKIPPED>
- **Evidence:** <list of found avoid-words or "none found">
- **Notes:** <any instances flagged for review>

### BC-05: Claims in Messaging Hierarchy
- **Status:** <PASS | WARN | SKIPPED>
- **Evidence:** <list of claims checked vs. proof ledger>
- **Notes:** <any claims missing from proof ledger>

### BC-07: Key Phrase alignment
- **Status:** <PASS | WARN | SKIPPED>
- **Evidence:** <CTAs / key labels checked vs. brand-dossier Key Phrases>
- **Notes:** <any mismatches>

---

## Domain 6: Measurement & Analytics

<_Note: DV-series checks (delayed) are out of scope here — deferred to post-deploy verification (`post-deploy-measurement-verification-prompt.md`). Document as "Deferred (T+1/T+7)" rather than FAIL._>

### M1: Staging GA4 measurement ID ≠ production GA4 measurement ID
- **Status:** <PASS | FAIL>
- **Evidence:** <staging ID prefix vs. production ID prefix (redacted)>
- **Notes:** <any environment config observations>

### M2: Staging ID belongs to different GA4 property than production (V-05 full check)
- **Status:** <PASS | FAIL | GAP-ADVISORY>
- **Evidence:** <property IDs for staging and production streams (from Admin API)>
- **Notes:** <if GAP-ADVISORY: S1B not run for this business; recommend measurement-quality-audit-prompt.md>

### M3: GA4 internal traffic filter status = Active (read-only confirm)
- **Status:** <PASS | WARN>
- **Evidence:** <filter status from Admin API; filter IP rule summary>
- **Notes:** <if WARN: remediate post-launch via G-07; do not activate here>

### M5: Cross-domain linking advisory (H — advisory)
- **Status:** <PASS | WARN | N/A>
- **Evidence:** <list external domains in conversion path; owner confirmation if applicable>
- **Notes:** <if WARN: owner to add domains in GA4 Tag Settings > Configure your Google tag > Domains; DV-03 tracks post-deploy verification>

### M6: SC-03 Coverage API guard (internal constraint check)
- **Status:** <PASS | VIOLATION>
- **Evidence:** <confirm no GSC Coverage bulk API calls made in this QA run>
- **Notes:** <SC-03b (manual GSC UI export) noted as deferred human action>

### M7: DNS redirect health (apex + www + booking path)
- **Status:** <PASS | FAIL>
- **Evidence:** <curl -I output for apex, www, booking redirect; final destination URL + HTTP status>
- **Notes:** <any redirect anomalies>

---

## Blockers (must fix before launch)

<If NO-GO, list all blocker failures with fix recommendations>

| Check | Domain | Issue | Fix Recommendation |
|-------|--------|-------|-------------------|
| C1 | Conversion | Form returns 500 error on submit | Debug API endpoint; check logs; verify DB connection |
| L1 | Legal | No cookie consent banner | Integrate consent management platform (CookieBot, OneTrust, custom) |

---

## Warnings (fix recommended; not blocking)

<List all warning-level failures>

| Check | Domain | Issue | Fix Recommendation |
|-------|--------|-------|-------------------|
| S4 | SEO | Meta description exceeds 160 chars on /about page | Trim description to ≤160 chars |
| P4 | Performance | Hero image still using JPEG | Convert to WebP or AVIF |

---

## Release Notes Section

**Pre-launch release notes (if GO):**
- Primary conversion flow: <describe what users can do>
- Key features live: <list>
- Known limitations: <list any warnings or deferred features>
- Monitoring/tracking: <analytics setup, error tracking>

**Rollback plan:**
- Rollback trigger: <what condition requires rollback — e.g., >5% error rate on conversion flow>
- Rollback procedure: <how to revert — e.g., revert deployment, disable feature flag, DNS cutover>
- Rollback validation: <how to confirm rollback worked — e.g., staging URL loads, error rate drops>
- Rollback owner: <who executes rollback — e.g., Pete, on-call engineer>

---

## Next Steps

**If GO:**
1. Commit this QA report to repo
2. Update loop state: mark S9B (launch QA) complete
3. Proceed to `/lp-launch` (S10) or experiment launch
4. Monitor blockers-turned-warnings for post-launch fix

**If NO-GO:**
1. Commit this QA report to repo
2. Create follow-up build tasks for each blocker via `/lp-replan`
3. Re-run `/lp-build` on blocker fixes
4. Re-run `/lp-launch-qa` after fixes deployed
5. Do NOT proceed to S10 until all blockers are resolved
```

## Completion message format

**If GO:**
```
Launch QA complete — GO decision.

**Audit Summary:**
- Business: <BIZ>
- Deployment: <URL>
- Domains audited: <list>
- Overall: X/Y checks passed (<% pass rate>)

**Blockers:** 0
**Warnings:** <count> (documented for post-launch fix)

**Report saved:** docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md

**Next step:** Proceed to `/lp-launch` (S10) or experiment launch.
```

**If NO-GO:**
```
Launch QA complete — NO-GO decision (blockers found).

**Audit Summary:**
- Business: <BIZ>
- Deployment: <URL>
- Domains audited: <list>
- Overall: X/Y checks passed (<% pass rate>)

**Blockers:** <count> (must fix before launch)
**Warnings:** <count>

**Blocker summary:**
- <Check ID>: <Issue summary>
- <Check ID>: <Issue summary>

**Report saved:** docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md

**Next step:** Fix blockers via `/lp-replan` + `/lp-build`, then re-run `/lp-launch-qa`.
```

## Commit format

```bash
git add docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md
git add docs/business-os/startup-baselines/<BIZ>/loop-state.json  # if exists
git commit -m "$(cat <<'EOF'
docs(launch-qa): <BIZ> pre-launch QA — <GO | NO-GO>

- Audited domains: <conversion, seo, performance, legal, measurement | all>
- Deployment target: <staging | production>
- Decision: <GO | NO-GO>
- Blockers: <count> | Warnings: <count>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

## Evidence format

Screenshots, network logs, HTML snippets, Lighthouse reports should be saved to `docs/business-os/site-upgrades/<BIZ>/launch-qa-evidence-YYYY-MM-DD/` and referenced by relative path in the report.
