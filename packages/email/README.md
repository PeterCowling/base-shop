# @acme/email

Email helper utilities used across the monorepo.

## SDK versions

This package wraps the official SendGrid and Resend Node SDKs.

- [`@sendgrid/mail` v8.1.5](https://www.npmjs.com/package/@sendgrid/mail)
- [`resend` v3.5.0](https://www.npmjs.com/package/resend)

## Updating SDKs

When bumping either SDK:

1. Update `package.json` with the new versions.
2. Review upstream release notes for breaking changes and verify the providers remain compatible, especially around the `sanityCheck` option.
3. Run the test suite and update this README with the new versions and any compatibility notes.

## Compatibility notes

These providers are tested against Node.js 18+. When upgrading SDK versions,
ensure the APIs remain compatible with our wrapper implementations and supported
Node versions.

## Environment variables

The email package relies on several environment variables when sending
campaigns or managing contacts:

- `SENDGRID_API_KEY` – optional API key used to send mail via the SendGrid provider
- `SENDGRID_MARKETING_KEY` – grants access to SendGrid marketing APIs for
  contact and segment management
- `RESEND_API_KEY` – used by the Resend provider and must include `emails.send`,
  `contacts.write`, `contacts.read`, and `segments.read` scopes

Set the relevant variables in the host environment before invoking any of the
package helpers.

## Provider sanity checks

`SendgridProvider` and `ResendProvider` accept an optional `{ sanityCheck: true }`
parameter. When enabled, the constructor performs a lightweight authenticated
request to verify that the configured API key is valid.  The result of this
check can be awaited using the exposed `ready` promise:

```ts
const provider = new SendgridProvider({ sanityCheck: true });
await provider.ready; // throws if credentials are rejected
```

If the credentials are invalid, the promise rejects with a descriptive error
containing the HTTP status code.  Consumers that do not wish to perform this
startup validation can omit the option.

## Template sanitization

HTML passed via template parameters such as `body` or `content` is sanitized
with [DOMPurify](https://github.com/cure53/DOMPurify) before being inserted into
email markup. Custom source templates also entity-encode placeholder values to
prevent HTML injection. The package exports an `escapeHtml` helper for encoding
untrusted strings, but you should still sanitize any user content before
rendering templates.
