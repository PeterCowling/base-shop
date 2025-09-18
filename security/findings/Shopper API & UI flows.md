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

## Plaintext password storage during reset flow
- **Component**: `apps/shop-bcd/src/app/api/password-reset/[token]/route.ts`
- **CWE**: CWE-256 – Plaintext Storage of a Password
- **OWASP**: A02:2021 – Cryptographic Failures
- **Risk**: High

### Exploit narrative
The reset completion endpoint wrote whatever `password` value the client supplied straight into the `passwordHash` column. Because the route never hashed the password, the database stored it in plaintext. Any database leak, logging tap, or insider with read access could trivially recover shopper passwords and reuse them elsewhere. The next login attempt would also fail because authentication expects argon2 hashes, forcing affected users into a confusing lockout while simultaneously leaking their secrets.

### Minimal patch
Hash the password with argon2 before calling `updatePassword`, so only a slow-to-crack hash ever lands in persistent storage and the authentication flow continues to work.

### Tests
`apps/shop-bcd/__tests__/password-reset.test.tsx` now mocks the argon2 hasher and asserts that `updatePassword` receives the hashed output rather than the raw password. The check fails with the vulnerable implementation (because the mock sees the plaintext) and passes after applying the fix.
