# Email Package

This package provides email sending utilities for the Base Shop project. It integrates with both SendGrid and Resend.

## SDK Versions

- [@sendgrid/mail](https://www.npmjs.com/package/@sendgrid/mail) v8.1.5
- [resend](https://www.npmjs.com/package/resend) v3.5.0

## Updating SDKs

1. Update the dependencies in `package.json` with `pnpm update @sendgrid/mail resend --latest`.
2. Review upstream release notes for breaking changes.
3. Verify compatibility with our Node.js runtime (currently Node 20+) and any API usage.
4. Run `pnpm --filter @acme/email test` to ensure everything still works.
5. Update this README and any other documentation to reflect the new versions.

## Compatibility Notes

- `@sendgrid/mail` v8.x requires Node.js 12 or later and communicates with the SendGrid REST API.
- `resend` v3.x requires Node.js 18 or later and uses the Resend API.
- Ensure that configuration and environment variables match the expectations of the selected provider.

## Documentation

Whenever the `@sendgrid/mail` or `resend` versions change, update the version numbers and links above so our documentation stays accurate.

