# @acme/email

Email helper utilities used across the monorepo.

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
