---
Type: Setup-Runbook
Status: Draft
Domain: Platform
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Relates-to: docs/plans/cochlearfit-deployment-readiness/plan.md
Task: TASK-03
---

# Cochlear Fit Email Service Setup (TASK-03)

## Current Status
- Blocked: `cochlearfit.com` resolves as `NXDOMAIN` as of 2026-02-14, so sender-domain DNS verification cannot be completed.
- Evidence: `dig @1.1.1.1 cochlearfit.com` -> `status: NXDOMAIN`; `dig @8.8.8.8 cochlearfit.com` -> `status: NXDOMAIN`.

## Provider Decision
- Selected provider: Resend (per plan recommendation)
- Rationale: Good DX, simple API, straightforward domain verification.

If we later switch to SendGrid, keep the same secret/ENV contract (`EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM_ADDRESS`) and swap implementation in TASK-07.

## Sender Identity
- From address: `orders@cochlearfit.com`
- Reply-to: Decide: `support@cochlearfit.com` or `orders@cochlearfit.com`

## Secrets (Do Not Commit Values)
Store secret values in 1Password (create an item like: `Cochlear Fit - Resend API Key`).

- `EMAIL_PROVIDER` = `resend`
- `EMAIL_API_KEY` = (Resend API key)
- `EMAIL_FROM_ADDRESS` = `orders@cochlearfit.com`

## DNS Verification Checklist (TC-01)
Once the domain resolves:

1. Add the Resend-provided DNS records in the DNS provider for `cochlearfit.com`:
- SPF TXT record
- DKIM records (provider-specific)
- DMARC TXT record (recommended baseline: `p=none` during rollout, then tighten)

2. Verify via CLI:

```bash
DIG='dig +noall +answer'

# Domain exists
$DIG cochlearfit.com A

# DMARC
$DIG _dmarc.cochlearfit.com TXT

# SPF (exact label depends on DNS layout)
$DIG cochlearfit.com TXT
```

3. Verify in Resend dashboard: domain shows `Verified`.

## API Test Checklist

### TC-02: Send A Test Email
Run a send against a personal inbox and confirm deliverability (inbox and spam):

```bash
# Replace $RESEND_API_KEY locally (do not commit it)
curl -sS https://api.resend.com/emails   -H "Authorization: Bearer $RESEND_API_KEY"   -H "Content-Type: application/json"   -d '{
    "from": "orders@cochlearfit.com",
    "to": ["<YOUR_EMAIL>"],
    "subject": "Cochlear Fit test email",
    "html": "<p>Test email: Resend configured.</p>"
  }'
```

### TC-03: API Authentication

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://api.resend.com/emails   -H "Content-Type: application/json"   -d '{"from":"orders@cochlearfit.com","to":["<YOUR_EMAIL>"],"subject":"test","html":"<p>hi</p>"}'
# Expect: 401
```

### TC-04: Rate Limit Sanity
Send 5-10 emails in a loop; confirm no rate limit errors at the chosen tier.

## Handoff Notes For TASK-07
- Worker should send receipt emails on `checkout.session.completed` webhook.
- Template will be implemented in TASK-06.
- Email send failures must not fail the webhook (log + return 200).

## Open Items
- Confirm the real production domain (if not `cochlearfit.com`).
- Decide DMARC policy posture for launch (`p=none` initially vs stricter).
- Confirm whether we need separate sender domains for staging vs production.
