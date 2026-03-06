---
Type: Breakpoint-Sweep-Report
Status: Complete
Audit-Date: 2026-03-06
Target-URL: https://dev.xa-b-site.pages.dev/, https://xa-uploader-preview.peter-cowling1976.workers.dev/
Breakpoints-Tested: 1280
Routes-Tested: 7
Issues-Total: 0
S1-Blockers: 0
S2-Major: 0
S3-Minor: 0
---

# Breakpoint Sweep Report — xa-staging

## Scope

- **Target URL:** `https://dev.xa-b-site.pages.dev/`, `https://xa-uploader-preview.peter-cowling1976.workers.dev/`
- **Breakpoints tested:** `1280x900`
- **Routes tested:** `/`, `/products/hermes-constance-18-noir-epsom`, `/cart`, `/wishlist`, `/login`, `/` -> `/login`, `/instructions` -> `/login`
- **Auth/theme/locale assumptions:** no-auth scope only for `xa-uploader`; default theme for both apps; default deployed locale/browser state only

## Summary Matrix

| Breakpoint | Route | S1 | S2 | S3 | Notes |
|---|---|---:|---:|---:|---|
| 1280 | `xa-b /` | 0 | 0 | 0 | No horizontal overflow or clipped primary controls |
| 1280 | `xa-b /products/hermes-constance-18-noir-epsom` | 0 | 0 | 0 | Gallery, buy box, and footer remain contained |
| 1280 | `xa-b /cart` | 0 | 0 | 0 | Empty-cart state remains centered and contained |
| 1280 | `xa-b /wishlist` | 0 | 0 | 0 | Empty-wishlist state remains centered and contained |
| 1280 | `xa-uploader /login` | 0 | 0 | 0 | Login card remains centered and fully usable |
| 1280 | `xa-uploader /` | 0 | 0 | 0 | Redirects cleanly to `/login`; no layout defect on resulting page |
| 1280 | `xa-uploader /instructions` | 0 | 0 | 0 | Redirects cleanly to `/login`; no layout defect on resulting page |

## Issues

No responsive layout failures detected across the tested breakpoint/route matrix.

## Assumptions and Coverage Gaps

- `xa-uploader` was audited in unauthenticated scope only. `/` and `/instructions` both redirect to `/login`, so the authenticated console and instructions surfaces were not rendered in this pass.
- Only one breakpoint was requested and tested: `1280px`. This is a desktop-only sweep, not a mobile/tablet responsive audit.
- The sweep checked page-level overflow, visible element bleed, and primary control containment. It did not include a full interaction/state crawl of every drawer, modal, or post-login console workflow.
- `xa-b` emitted a runtime page error during browser execution on the tested routes:
  - `Minified React error #418`
  - This did not produce a visible layout failure at `1280px`, so it is not logged as a breakpoint issue, but it should be investigated separately.
- `xa-uploader` staging rendered Chinese copy on the login screen in the captured browser session. This did not create a containment or reflow failure at `1280px`, but it may indicate locale/default-copy drift worth checking separately.

## Evidence

- `xa-b` home: [w1280-xa-b-home-full](./screenshots/w1280-xa-b-home-full.png)
- `xa-b` product: [w1280-xa-b-product-full](./screenshots/w1280-xa-b-product-full.png)
- `xa-b` cart: [w1280-xa-b-cart-full](./screenshots/w1280-xa-b-cart-full.png)
- `xa-b` wishlist: [w1280-xa-b-wishlist-full](./screenshots/w1280-xa-b-wishlist-full.png)
- `xa-uploader` login: [w1280-xa-uploader-login-full](./screenshots/w1280-xa-uploader-login-full.png)
- `xa-uploader` root redirect result: [w1280-xa-uploader-root-full](./screenshots/w1280-xa-uploader-root-full.png)
- `xa-uploader` instructions redirect result: [w1280-xa-uploader-instructions-full](./screenshots/w1280-xa-uploader-instructions-full.png)

## Suggested Fix Order

1. Investigate the `xa-b` runtime `React error #418` because it could mask future UI defects even though desktop layout is currently stable.
2. Confirm whether the `xa-uploader` login locale/copy on staging is expected.
3. If broader UI confidence is needed, run a second sweep at mobile and tablet widths with authenticated `xa-uploader` access.
