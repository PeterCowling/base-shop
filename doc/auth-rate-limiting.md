# Authentication Rate Limiting

The CMS authentication endpoint `/api/auth/[...nextauth]` uses [`rate-limiter-flexible`](https://github.com/animir/node-rate-limiter-flexible) to limit requests per IP address.

## Thresholds

- **Points**: 10 requests
- **Duration**: 60 seconds

Exceeding the limit returns **HTTP 429 Too Many Requests**.

Update the limiter configuration in `apps/cms/src/app/api/auth/[...nextauth]/route.ts` to adjust thresholds.
