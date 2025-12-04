Type: Guide
Status: Active
Domain: Performance
Last-reviewed: 2025-12-02

# Performance Budgets

This document outlines p95 latency goals for critical API routes. Each goal mirrors the `http_req_duration` threshold defined in its accompanying [k6](https://k6.io/) load test script.

| Route | k6 script | p95 latency threshold |
|-------|-----------|-----------------------|
| Checkout | `apps/api/load-tests/checkout.k6.js` | < 750ms |
| Cart | `apps/api/load-tests/cart.k6.js` | < 500ms |
| Media | `apps/api/load-tests/media.k6.js` | < 1000ms |
| Rental return | `apps/api/load-tests/rental-return.k6.js` | < 1500ms |
| Publish upgrade | `apps/api/load-tests/publish-upgrade.k6.js` | < 5000ms |

These budgets help ensure that high-traffic routes remain responsive under load. Adjust the thresholds in the corresponding k6 scripts if real-world conditions require different targets.
