# CMS Next.js admin APIs

## SSRF in unauthenticated media probe

- **Severity:** High
- **CWE:** [CWE-918 - Server-Side Request Forgery (SSRF)](https://cwe.mitre.org/data/definitions/918.html)
- **OWASP:** [OWASP Top 10 2021 - A10: Server-Side Request Forgery](https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_(SSRF)/)

### Affected component
- `apps/cms/src/app/api/media/probe/route.ts`

### Exploit narrative
1. The `/api/media/probe` route accepted any `url` query parameter and issued a server-side `fetch()` without authentication or host validation.
2. An unauthenticated attacker could call the endpoint directly and supply targets such as `http://127.0.0.1:80/` or `http://169.254.169.254/`, coercing the CMS to reach internal services that are otherwise unreachable from the public internet.
3. The attacker can use the response status and headers to map the internal network or exfiltrate metadata from sensitive services (e.g., cloud instance metadata), satisfying the impact criteria for high-severity SSRF.

### Patch summary
- Require a valid NextAuth session via `getServerSession(authOptions)` before performing the probe.
- Parse the attacker-supplied URL with the WHATWG `URL` API, reject non-HTTP(S) schemes, and block loopback, link-local, and RFC1918 destinations.
- Added Jest coverage to lock in the expected behavior and prevent regressions.

### Verification
- `apps/cms/src/app/api/media/probe/__tests__/route.test.ts` – the "rejects requests targeting private networks" case failed before the fix (the probe succeeded against `127.0.0.1`) and now passes with the hardened validation.
