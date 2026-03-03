# Caryina — Development Notes

## GA4 Analytics Setup

The analytics pipeline is wired end-to-end but requires two operator steps before
events reach GA4 Realtime:

### 1. Set the GA4 measurement ID in `data/shops/caryina/settings.json`

Replace the `"id": "G-XXXXXXXXXX"` placeholder with your real GA4 measurement ID
(format: `G-XXXXXXXXXX`). The `provider` field must remain `"ga"`.

A server restart is required after changing `settings.json` — the provider is
cached at module load time.

### 2. Set the `GA_API_SECRET` environment variable

The GA4 Measurement Protocol requires an API secret alongside the measurement ID.
Generate one in: GA4 property → Admin → Data Streams → Web → Measurement Protocol API secrets.

Set it as: `GA_API_SECRET=<your-api-secret>` in the Cloudflare Workers secret store
(`wrangler secret put GA_API_SECRET`).

**Fallback behaviour:** If `GA_API_SECRET` is unset at runtime, the provider
resolution falls back to the console provider — events appear in server logs but
do not reach GA4.

### 3. Verify with GA4 Realtime

After deploying with both values set, accept cookies on the live site and open
GA4 → Realtime. You should see at least one event within 60 seconds.

---

## Customer accounts

If we add customer accounts (login, register, order history, guest order tracking),
a ready-to-adapt implementation exists at:

**`docs/reference/xa-account/`**

It includes session-cookie auth (JWT, Web Crypto API), rate-limited route handlers,
and a full user + orders store. The one piece that needs adapting before it works
on Cloudflare Workers: the file-backed stores (`accountStore.ts`, `ordersStore.ts`)
need to be ported to D1 or KV. Everything else is CF Workers compatible. See the
README in that directory for step-by-step integration notes.
