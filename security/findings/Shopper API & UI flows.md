# Shopper API & UI flows Findings

## Plaintext password persisted during reset (Fixed)
- **Component**: apps/shop-bcd/src/app/api/password-reset/[token]/route.ts
- **CWE**: CWE-256 (Plaintext Storage of a Password)
- **OWASP**: A02:2021 – Cryptographic Failures
- **Risk**: High

### Issue
The password reset API accepted a new password and wrote it directly through `updatePassword` without hashing. Anyone with database or log access to the stored values would obtain raw shopper passwords, enabling full account compromise and reuse across other sites.

### Exploit Scenario
An attacker who steals a backup of the shopper database after a password reset can immediately read the unhashed password and log in as the victim. Because the value is not protected by a one-way hash, no further cracking effort is required.

### Remediation
Hash the incoming password with Argon2 before calling `updatePassword`, ensuring only the derived hash is stored. The updated unit test mocks the hasher and verifies the API never forwards the plaintext password to the persistence layer.

### Verification
- `apps/shop-bcd/__tests__/password-reset.test.tsx` now asserts `updatePassword` receives the Argon2 hash. It fails against the pre-fix code path that stored plaintext and passes after applying the patch.
- `pnpm --filter @apps/shop-bcd exec jest --runInBand --detectOpenHandles --config ../../jest.config.cjs --coverage=false --runTestsByPath __tests__/password-reset.test.tsx`
