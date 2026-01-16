Type: Guide
Status: Active
Domain: XA
Last-reviewed: 2025-12-28

# XA-C deployment (Cloudflare Pages, stealth mode)

XA is a Next.js app intended for Cloudflare Pages using `@cloudflare/next-on-pages`.

## Build and local preview
```
pnpm --filter @apps/xa-c exec next-on-pages
pnpm --filter @apps/xa-c exec wrangler pages dev .vercel/output/static --compatibility-flag=nodejs_compat --port 3010
```

## Offline support (after first visit)
XA registers a runtime-caching service worker in production builds so the app shell and search
can load offline after at least one successful online visit.

- Service worker: `apps/xa/public/sw.js`
- Offline fallback page: `apps/xa/public/offline.html`
- Cache busting: build stamps `NEXT_PUBLIC_XA_SW_VERSION` from the commit (override via env)

## Stealth controls
Set these in Cloudflare Pages project variables (or `.env` for local use):
- `XA_STEALTH_MODE=true`
- `XA_STRICT_STEALTH=true` (always return 404 for unauthorized requests)
- `XA_REQUIRE_CF_ACCESS=true`
- `XA_ALLOWED_HOSTS=thestylemarket.shop`
- `XA_GUARD_TOKEN=...` (optional header: `x-xa-guard`)
- `XA_ACCESS_COOKIE_SECRET=...` (signs access cookies)
- `XA_INVITE_HASH_SECRET=...` (optional: hashes stored invite codes with a separate secret)
- `XA_STEALTH_INVITE_CODES=...` (comma-separated optional static invite codes)
- `XA_ALLOW_INDEXING=false`
- `NEXT_PUBLIC_STEALTH_MODE=true` (hides brand/contact info in the UI)
- `NEXT_PUBLIC_STEALTH_BRAND_NAME=Private preview`

### Invite gate + admin console
- Gate URL: `/access`
- Admin console: `/access/admin` (requires `XA_ACCESS_ADMIN_TOKEN`)
- Optional store path: `XA_ACCESS_STORE_PATH` (defaults to `apps/xa/data/access/access-store.json`)

### Buzz levers (optional)
- `STEALTH_DROP_LABEL`
- `STEALTH_DROP_OPENS_AT` (ISO timestamp)
- `STEALTH_KEYS_REMAINING`
- `STEALTH_KEY_SERIES` (comma-separated)

### Quick QA checklist
- With stealth on and no access cookie, `/` redirects to `/access`.
- Invalid key shows an error message; valid key sets cookie and unlocks the app.
- Admin console can create/revoke keys and issue keys from requests.
- `/access` shows drop countdown/series when envs are set.
- Responses in stealth include noindex headers.

## Duplication
Use separate environments in `apps/xa/wrangler.toml` (`preview`, `backup`) or
clone the Cloudflare Pages project and reuse the same env var set.
