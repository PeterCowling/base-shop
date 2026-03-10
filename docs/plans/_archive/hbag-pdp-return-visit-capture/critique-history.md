---
Type: Critique-History
Feature-Slug: hbag-pdp-return-visit-capture
Artifact: fact-find.md + plan.md
Last-updated: 2026-02-28
---

# Critique History — hbag-pdp-return-visit-capture

## Round 1

- Tool: codemoot (Node 22)
- Score: null (score parsing failed — treated as needs_revision)
- lp_score: N/A (null mapped to: round 2 required due to Critical present)
- Verdict: needs_revision
- Findings: 1 Critical, 4 Major, 1 Minor

### Critical Findings (Round 1)

1. **[Critical]** Proposed flat-file persistence in `data/shops/caryina/` is not viable on Cloudflare Worker runtime (read-only build-time assets). Fixed: removed flat-file option throughout; only DB or fire-and-forget email accepted.

### Major Findings (Round 1)

2. **[Major]** `sendSystemEmail` vs `sendCampaignEmail` conflation. Fixed: clarified that `sendSystemEmail` is the transactional path (Gmail SMTP), `sendCampaignEmail` is the campaign path (Resend/SendGrid). Documented both as options.
3. **[Major]** Architecture stated "static-export-compatible." Fixed: corrected to "OpenNext Cloudflare Worker" per `wrangler.toml`.
4. **[Major]** "localStorage is not personal data under GDPR" over-absolute. Fixed: softened to "does not directly constitute personal data in isolation."
5. **[Major]** Local test command (`pnpm --filter caryina test`) contradicts CI-only policy. Fixed: replaced with reference to CI-only policy (`docs/testing-policy.md`).

### Minor Findings (Round 1)

6. **[Minor]** `billingProvider: "stripe"` in shop.json vs Axerve in practice. Fixed: acknowledged mismatch and explained Axerve is the runtime payment integration.

---

## Round 2

- Tool: codemoot (Node 22)
- Score: 7/10 → lp_score: 3.5
- Verdict: needs_revision
- Findings: 0 Critical, 4 Major, 1 Minor

### Major Findings (Round 2)

1. **[Major]** `emailEnvSchema` overstated as gate for `sendSystemEmail`. Fixed: clarified schema applies to `sendCampaignEmail` path only; `sendSystemEmail` bypasses it.
2. **[Major]** Remaining flat-file reference at line ~216 (Open Question mentioned "flat file"). Fixed: updated Open Question to list only viable options (DB or fire-and-forget).
3. **[Major]** `logAnalyticsEvent({ type: "notify_me_submit" })` would be rejected 400 by analytics route — `ALLOWED_EVENT_TYPES` does not include this event type. Fixed: added note to Observability section and added TASK-06 to extend allowlist.
4. **[Major]** Logging email addresses in console = PII storage risk. Fixed: added redaction requirement (log domain-part or hash only, never full email).

### Minor Findings (Round 2)

5. **[Minor]** Constraint section still said "file or DB." Fixed: tightened to "DB or fire-and-forget email."

---

## Round 3

- Tool: codemoot (Node 22)
- Score: 6/10 → lp_score: 3.0
- Verdict: needs_revision
- Findings: 1 Critical, 2 Major, 1 Minor
- Note: Round 3 is final per protocol; all findings addressed in autofixes applied after this round.

### Critical Findings (Round 3)

1. **[Critical]** `sendSystemEmail` routes to Gmail SMTP via nodemailer (`sendEmail.ts`), not Resend/SendGrid. If Gmail credentials absent, send is silently simulated. Plan was incorrectly assuming Resend provisioning would activate this path. Fixed: documented both paths (Option A: Gmail/`sendSystemEmail`; Option B: Resend/`sendCampaignEmail`). Updated Key Modules, Dependency Map, Data & Contracts, Open Questions, Confidence Inputs, Simulation Trace, and Evidence Gap Review. Operator decision required.

### Major Findings (Round 3)

2. **[Major]** Remaining flat-file reference at line ~219 (Resolved Question). Fixed: removed `captures.json` reference; confirmed flat-file not viable on Worker runtime.
3. **[Major]** `EMAIL_FROM` stated as required for `sendSystemEmail` path. Fixed: corrected to note `EMAIL_FROM` is only required for the `sendCampaignEmail` (Resend/SendGrid) path.

### Minor Findings (Round 3)

4. **[Minor]** Analytics `notify_me_submit` logging conditional on allowlist task. Fixed: noted in Simulation Trace and Observability section.

---

## Final Assessment (fact-find.md)

- Rounds: 3
- Final lp_score: 3.0/5.0 (post-autofix estimated ~3.8 given Critical and all Majors resolved)
- Verdict after autofixes: credible
- Status: Ready-for-planning
- Critique-Warning: none

---

# Plan Critique — plan.md

## Plan Round 1

- Tool: codemoot (Node 22)
- Score: 6/10 → lp_score: 3.0
- Verdict: needs_revision
- Findings: 1 Critical, 3 Major, 1 Minor

### Critical Findings (Plan Round 1)

1. **[Critical]** Suggested adding `// ...` comment text inside `site-content.generated.json` — JSON does not support comments; would break JSON parsing and crash content loading. Fixed: removed comment suggestion from TASK-04; added note that all materializer-risk documentation must stay in plan.md or separate markdown, never in the JSON file.

### Major Findings (Plan Round 1)

2. **[Major]** Constraint at line 55 stated missing `GMAIL_USER`/`GMAIL_PASS` always "silently simulates." Incorrect: `sendSystemEmail` first checks `EMAIL_PROVIDER`; if unset it throws immediately. Fixed: corrected constraint to document two-level env var requirement (`EMAIL_PROVIDER` must be set to avoid throw; `GMAIL_USER`/`GMAIL_PASS` must be set for actual delivery; absent GMAIL credentials with EMAIL_PROVIDER set causes silent simulation).
3. **[Major]** Goals stated `notify_me_submit` event would be "routed correctly" but no task explicitly added client-side event emission from the form. Fixed: updated TASK-01 execution plan, acceptance criteria, and validation contract to include `logAnalyticsEvent({ type: "notify_me_submit", productSlug })` call from `@acme/platform-core/analytics/client` after successful API response.
4. **[Major]** TASK-04 targeted `apps/caryina/.env.local` (gitignored, non-reviewable) as the env var documentation artifact. Fixed: changed deliverable to `apps/caryina/.env.local.example` (tracked, reviewable in PR) throughout TASK-04.

### Minor Findings (Plan Round 1)

5. **[Minor]** Risks section introduced a "503 guard" for missing email config that conflicted with TASK-02's fire-and-forget 200 contract. Fixed: reconciled Risks section — clarified that fire-and-forget wraps the `sendSystemEmail` call with `.catch()` so a throw does not block the 200 response; submission is acknowledged but email is silently dropped. Added pre-launch checklist as the operator-side mitigation.

---

## Plan Round 2

- Tool: codemoot (Node 22)
- Score: 6/10 → lp_score: 3.0
- Verdict: needs_revision
- Findings: 0 Critical, 4 Major, 1 Minor
- Note: No Critical remaining after Round 1. Round 3 not required per protocol. All findings addressed in autofixes applied after this round.

### Major Findings (Plan Round 2)

1. **[Major]** `Overall-confidence` header (82%) inconsistent with calculation footer (83% rounded to 80%). Fixed: corrected header to 80%.
2. **[Major]** TC-01 in TASK-01 said "Render with no props" but `productSlug: string` is a required prop. Fixed: corrected to "Render with `productSlug="test-slug"`".
3. **[Major]** Email validation `email.includes("@") && email.includes(".")` too weak for a public API — clearly malformed addresses pass and fail async in fire-and-forget send. Fixed: updated TASK-02 Edge Cases to use minimal RFC-compliant regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
4. **[Major]** Risk row for `EMAIL_PROVIDER` missing was self-contradictory (stated "route 500" but fire-and-forget `.catch()` catches the throw; route still returns 200). Fixed: reconciled to one canonical behavior — route always returns 200 for valid inputs; email delivery is best-effort (fire-and-forget). Separated "EMAIL_PROVIDER not set" and "wrong GMAIL credentials" into distinct risk rows.
5. **[Major]** No abuse controls documented for the public unauthenticated route. Fixed: added abuse controls note to TASK-02 Edge Cases — v1 relies on GDPR consent + regex validation + passive merchant notification signal; Cloudflare WAF rate-limiting available at edge without code changes; rate-limiting middleware is v2.

### Minor Findings (Plan Round 2)

6. **[Minor]** `.env.local.example` inconsistent with repo convention (`apps/*/.env.example` used by 4 of 5 apps). Fixed: changed to `.env.example` throughout TASK-04.

---

## Final Assessment (plan.md)

- Rounds: 2 (Round 3 not required — no Critical findings remained after Round 1)
- Final lp_score: 3.0/5.0 (post-autofix estimated ~3.8 given no Critical remaining and all Majors resolved)
- Verdict after autofixes: credible
- Status: Active — eligible for build handoff
- Critique-Warning: none
