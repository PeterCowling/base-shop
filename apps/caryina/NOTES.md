# Caryina — Development Notes

## Customer accounts

If we add customer accounts (login, register, order history, guest order tracking),
a ready-to-adapt implementation exists at:

**`docs/reference/xa-account/`**

It includes session-cookie auth (JWT, Web Crypto API), rate-limited route handlers,
and a full user + orders store. The one piece that needs adapting before it works
on Cloudflare Workers: the file-backed stores (`accountStore.ts`, `ordersStore.ts`)
need to be ported to D1 or KV. Everything else is CF Workers compatible. See the
README in that directory for step-by-step integration notes.
