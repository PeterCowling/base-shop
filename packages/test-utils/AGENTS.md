# test-utils — Agent Notes

## Purpose
Helpers for Jest-based tests that require temporary repos, seeded shop data,
and common platform mocks.

## Operational Constraints
- `withTempRepo`/`withShop` must restore `process.cwd` and env reliably.
- Avoid leaking temporary directories or process env across tests.
- Keep mock helpers aligned with current auth/email implementations.

## Commands
- Build: `pnpm --filter @acme/test-utils build`
- Test: `pnpm --filter @acme/test-utils test`

## Safe Change Checklist
- Preserve callback ordering (`jest.resetModules` before imports).
- Keep default env values in sync with platform requirements.
