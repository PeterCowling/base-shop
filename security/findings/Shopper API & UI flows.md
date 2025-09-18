# Shopper API & UI flows Findings

## Password reset token leak enables account takeover
- **Component**: `apps/shop-bcd/src/app/api/password-reset/request/route.ts`
- **CWE**: CWE-201 – Exposure of Sensitive Information to an Unauthorized Actor
- **OWASP**: A02:2021 – Cryptographic Failures
- **Risk**: High

### Exploit narrative
The password-reset request endpoint minted a reset token, persisted it, and returned the token in the JSON response. An attacker only needs to know a victim's email address to trigger this endpoint and read the secret token directly from the API response. With that token the attacker can immediately complete the `/api/password-reset/[token]` flow and choose a new password for the victim, taking over the account without needing email access.

### Minimal patch
Send the reset token to the account owner over email instead of returning it to the caller, and return a generic `{ ok: true }` response regardless of whether the address exists. This keeps the token secret while preserving the original non-enumeration behavior.

### Tests
`apps/shop-bcd/__tests__/password-reset.test.tsx` now asserts that the request endpoint omits the `token` field and that `@acme/email.sendEmail` is invoked with the generated token. The test fails against the vulnerable handler (because the token is still in the payload and no email is sent) and passes after the fix.
