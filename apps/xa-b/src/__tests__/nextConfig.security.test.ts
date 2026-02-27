// xa-b is a static export (output: "export") with no server-side auth.
// NEXTAUTH_SECRET, SESSION_SECRET, and CART_COOKIE_SECRET are not required
// at build time — no production secret guards exist in next.config.mjs.
// This file is intentionally empty; the security test suite has been superseded
// by the static-export architecture adopted in feat(xa-b): set output:export.
export {};
