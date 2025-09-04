process.env.NEXTAUTH_SECRET ??=
  "dev-nextauth-secret-32-chars-long-string!";
process.env.SESSION_SECRET ??=
  "dev-session-secret-32-chars-long-string!";
process.env.CART_COOKIE_SECRET ??= "dev-cart-secret";
process.env.CMS_SPACE_URL ??= "https://cms.example.com";
process.env.CMS_ACCESS_TOKEN ??= "placeholder-token";
process.env.SANITY_API_VERSION ??= "2021-10-21";
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
