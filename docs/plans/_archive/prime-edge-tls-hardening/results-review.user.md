---
Type: Results-Review
Status: Draft
Feature-Slug: prime-edge-tls-hardening
Review-date: 2026-03-06
artifact: results-review
---

# Results Review

## Observed Outcomes
- Zone settings applied live: `hostel-positano.com` changed from ssl=flexible/TLS 1.0 to ssl=strict/TLS 1.2. Confirmed by script read-back and curl smoke tests (TLSv1.3 handshake, 301 HTTP→HTTPS redirect, TLS 1.0/1.1 rejected with SSL alert).
- Repeatable hardening script committed (`scripts/src/ops/apply-prime-zone-hardening.ts`) with dry-run, rollback, pre-flight cert check, and per-setting read-back confirmation. Runnable via `pnpm --filter scripts prime:apply-zone-hardening`.
- `apps/prime/public/_headers` written with HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, and CSP with complete Firebase allow-list. Deploys on next merge to main.
- `.github/workflows/prime.yml` extended with `healthcheck-custom-domain` job checking `https://guests.hostel-positano.com` after every main deploy.
- Route boundary ADR (`adr-route-boundary.md`) documents public/guest-gated/staff classifications and CF Access candidates for future work.
- All 6 tasks complete. Brikette unaffected (TLS 1.3 confirmed on `www.hostel-positano.com`, no 5xx errors).

## Standing Updates
- No standing updates: no registered artifacts changed

## New Idea Candidates
<!-- Scan for signals in these five categories. For each, cite a "Trigger observation" from this build. Use "None." if no evidence found for any category.
  1. New standing data source — external feed, API, or dataset suitable for Layer A standing intelligence
  2. New open-source package — library to replace custom code or add capability
  3. New skill — recurring agent workflow ready to be codified as a named skill
  4. New loop process — missing stage, gate, or feedback path in the startup loop
  5. AI-to-mechanistic — LLM reasoning step replaceable with a deterministic script
-->
- New standing data source — None.
- New open-source package — None.
- New skill — None.
- New loop process — None.
- AI-to-mechanistic — None.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** hostel-positano.com zone hardened with Full (strict) SSL, TLS 1.2 minimum, and browser security headers. Public/staff/guest route boundary documented. CI healthcheck validates custom domain on every deploy.
- **Observed:** Zone settings applied live and confirmed. Security headers committed and ready to deploy. CI extended. Route boundary ADR written. All smoke tests pass.
- **Verdict:** MET
- **Notes:** All stated operational outcomes delivered. Minor residual: `_headers` and CI job take effect on next merge to main (not yet in production). Zone-level hardening is live immediately.
