Type: Guide
Status: Active
Domain: Auth
Last-reviewed: 2025-12-02

# Authentication Rate Limiting

The NextAuth handler in `apps/cms` is protected with a simple in-memory rate limiter using [`rate-limiter-flexible`](https://www.npmjs.com/package/rate-limiter-flexible).

- **Points:** 5 requests
- **Duration:** per 60 seconds
- Exceeding the limit returns **HTTP 429 Too Many Requests**.

Adjust `points` or `duration` in `apps/cms/src/app/api/auth/[...nextauth]/route.ts` to change these thresholds.
