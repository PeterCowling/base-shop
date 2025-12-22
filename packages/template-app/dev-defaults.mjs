const DEV_NEXTAUTH = "dev-nextauth-secret-32-chars-long-string!";
const DEV_SESSION = "dev-session-secret-32-chars-long-string!";
function ensureStrong(name, fallback) {
  const val = process.env[name];
  if (!val || val.length < 32) process.env[name] = fallback;
}
ensureStrong("NEXTAUTH_SECRET", DEV_NEXTAUTH);
ensureStrong("SESSION_SECRET", DEV_SESSION);
process.env.CART_COOKIE_SECRET ??= "dev-cart-secret";
process.env.CMS_SPACE_URL ??= "https://cms.example.com";
process.env.CMS_ACCESS_TOKEN ??= "placeholder-token";
process.env.SANITY_API_VERSION ??= "2021-10-21";
// Email: default to noop provider during local builds so env validation passes
process.env.EMAIL_PROVIDER ??= "noop";
if (process.env.NODE_ENV !== "production") {
  process.env.INVENTORY_AUTHORITY_TOKEN ??= "dev-inventory-token";
}
// Normalize AUTH_TOKEN_TTL so schema validation passes during build.
// Accept plain numbers from the shell (e.g. 900) by treating them as seconds.
if (process.env.AUTH_TOKEN_TTL == null) {
  process.env.AUTH_TOKEN_TTL = "15m";
} else {
  const raw = String(process.env.AUTH_TOKEN_TTL);
  const trimmed = raw.trim();
  if (trimmed === "") {
    process.env.AUTH_TOKEN_TTL = "15m";
  } else if (/^\d+$/.test(trimmed)) {
    process.env.AUTH_TOKEN_TTL = `${trimmed}s`;
  } else if (/^(\d+)\s*([sm])$/i.test(trimmed)) {
    const [, num, unit] = trimmed.match(/^(\d+)\s*([sm])$/i);
    process.env.AUTH_TOKEN_TTL = `${num}${unit.toLowerCase()}`;
  }
}
