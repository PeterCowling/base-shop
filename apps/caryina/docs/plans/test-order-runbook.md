---
Type: Runbook
Status: Active
Domain: Caryina
Last-reviewed: 2026-02-28
---

# HBAG Caryina Axerve Sandbox Test Order Runbook

Use this runbook before launch to prove checkout works against the real Axerve sandbox SOAP service (not local mock mode).

## 1. Prerequisites

### Step 1 — Get sandbox credentials and test-card references
DO:
1. Open `https://docs.axerve.com`.
2. Find the Axerve/GestPay sandbox testing pages and note the current test cards for:
   - a successful authorization flow
   - a declined authorization flow
3. Open your Axerve merchant portal (the login URL provided by Axerve for your account).
4. In the portal, locate your **sandbox** credentials and copy:
   - sandbox `shopLogin`
   - sandbox `apiKey`

SAVE:
- `shopLogin` -> secure password manager entry for Caryina sandbox
- `apiKey` -> secure password manager entry for Caryina sandbox
- Links to the exact Axerve docs page(s) you used for test card data -> run log / launch checklist

DONE WHEN:
- You have both sandbox credentials and two card scenarios (one success, one decline) from official Axerve docs.

IF BLOCKED:
- If you cannot access the portal or sandbox credentials are missing, contact Axerve support/account manager and request sandbox API access before continuing.

## 2. Environment setup

### Step 2 — Configure `.env.local` for sandbox mode
DO:
1. Open `apps/caryina/.env.local`.
2. Make these exact changes:
   - Remove or comment out `AXERVE_USE_MOCK=true`.
   - Set `AXERVE_SANDBOX=true`.
   - Set `AXERVE_SHOP_LOGIN=<your_sandbox_shop_login>`.
   - Set `AXERVE_API_KEY=<your_sandbox_api_key>`.
   - Set `MERCHANT_NOTIFY_EMAIL=<your_test_email_address>`.
3. Save the file.
4. Start the app:
   - `pnpm --filter @apps/caryina dev`
5. Keep this precedence rule in mind:
   - `AXERVE_USE_MOCK=true` overrides `AXERVE_SANDBOX=true`.
   - If mock is set, sandbox is never reached.

SAVE:
- Updated `apps/caryina/.env.local`
- Local server log showing app started on port `3018`

DONE WHEN:
- The app is running and `.env.local` has sandbox credentials with mock disabled.
- You understand that `AXERVE_SANDBOX=true` routes SOAP calls to:
  `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL`

IF BLOCKED:
- If the app does not start, fix local startup issues first.
- If credentials fail in later steps, re-check that they are sandbox credentials (not production credentials).

## 3. Success test procedure

### Step 3 — Run a payment that should succeed
DO:
1. Open `http://localhost:3018/en/checkout`.
2. If the cart is empty, add one product first, then return to checkout.
3. Fill card fields using a **success** test card from official Axerve docs (`https://docs.axerve.com`).
   - Optional note: `4111111111111111` is commonly used as a Visa test PAN in many sandboxes, but you must verify current validity in Axerve docs.
4. Click `Pay now`.
5. Open browser DevTools -> `Network` and inspect the `POST /api/checkout-session` response.

SAVE:
- Screenshot of checkout success page (`/[lang]/success`)
- Copy of JSON response from `POST /api/checkout-session`
- Timestamped note in launch checklist that success flow passed

DONE WHEN:
- Browser redirects to `/{lang}/success`.
- `POST /api/checkout-session` returns HTTP `200` with shape:

```json
{
  "success": true,
  "transactionId": "<axerve_transaction_id>",
  "amount": 12345,
  "currency": "eur"
}
```

IF BLOCKED:
- If response is `502` with `{ "error": "Payment service unavailable" }`, go to section 7 (Fallback), then retry sandbox later.
- If response is `402`, you likely used a decline card; repeat with an Axerve-documented success card.

## 4. Decline test procedure

### Step 4 — Run a payment that should be declined
DO:
1. Open `http://localhost:3018/en/checkout`.
2. Ensure there is at least one item in cart.
3. Fill card fields using a **decline** test card/scenario from official Axerve docs (`https://docs.axerve.com`).
4. Click `Pay now`.
5. Open browser DevTools -> `Network` and inspect the `POST /api/checkout-session` response.

SAVE:
- Screenshot of decline error shown in checkout UI
- Copy of JSON response from `POST /api/checkout-session`
- Timestamped note in launch checklist that decline flow passed

DONE WHEN:
- Checkout remains on the same page and shows a payment error.
- `POST /api/checkout-session` returns HTTP `402` with shape:

```json
{
  "success": false,
  "error": "Card declined"
}
```

Note: the `error` string may be Axerve `errorDescription`; some declines may show `"Payment declined"` when Axerve does not provide a description.

IF BLOCKED:
- If you get HTTP `200`, you used a success scenario by mistake; retry with an Axerve-documented decline scenario.
- If you get HTTP `502`, the sandbox is unavailable; use section 7 and retry sandbox later.

## 5. Reset to production

### Step 5 — Restore production-safe local config after testing
DO:
1. Open `apps/caryina/.env.local`.
2. Revert sandbox-only settings:
   - Remove or set `AXERVE_SANDBOX` so it is not `true`.
   - Ensure `AXERVE_USE_MOCK` is not set to `true`.
3. Restore real production credential sources for local production-like runs:
   - `AXERVE_SHOP_LOGIN=<production value from your secure secret store>`
   - `AXERVE_API_KEY=<production value from your secure secret store>`
4. Restore `MERCHANT_NOTIFY_EMAIL` to the normal merchant inbox for real orders.
5. Restart the app.

SAVE:
- Updated `apps/caryina/.env.local`
- Short change note in launch checklist: "sandbox test config removed"

DONE WHEN:
- Sandbox credentials are no longer active in local production-like testing.
- Mock mode is off.
- Merchant notification email target is back to the business inbox.

IF BLOCKED:
- If you are unsure which credentials are production, stop and confirm with the credential owner before sending any real traffic.

## 6. Email noise note

### Step 6 — Avoid sending test-order alerts to the live merchant inbox
DO:
1. During sandbox tests, keep `MERCHANT_NOTIFY_EMAIL` set to a personal/test inbox.
2. Only restore the real merchant inbox after sandbox testing is complete.

SAVE:
- Test inbox address used during sandbox run -> launch checklist

DONE WHEN:
- Sandbox success orders only notify your test inbox.

IF BLOCKED:
- If you cannot use a test inbox, pause sandbox testing to avoid polluting live order notifications.

## 7. Fallback

### Step 7 — If Axerve sandbox is down, verify route logic with mock mode
DO:
1. Open `apps/caryina/.env.local`.
2. Temporarily set:
   - `AXERVE_USE_MOCK=true`
   - (Optional) keep `AXERVE_SANDBOX=true` for later, but remember mock has priority and sandbox will not be called.
3. Restart the app and submit a checkout payment once.
4. Confirm the route works end-to-end (API returns success shape and checkout can proceed).
5. Remove `AXERVE_USE_MOCK=true`.
6. Retry sections 3 and 4 against real sandbox when available.

SAVE:
- One mock-mode test result in launch checklist marked clearly as `MOCK ONLY`
- Retry timestamp for real sandbox run

DONE WHEN:
- You have confirmed route wiring in mock mode and then re-attempted real sandbox testing.

IF BLOCKED:
- If sandbox remains unavailable, do not send live traffic until both real sandbox checks (success + decline) pass.
