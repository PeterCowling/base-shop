process.env.NEXTAUTH_SECRET ??= "dev-nextauth-secret";
process.env.SESSION_SECRET ??= "dev-session-secret";
process.env.CART_COOKIE_SECRET ??= "dev-cart-secret";
process.env.CMS_SPACE_URL ??= "https://cms.example.com";
process.env.CMS_ACCESS_TOKEN ??= "placeholder-token";
process.env.SANITY_API_VERSION ??= "2021-10-21";
// Normalize AUTH_TOKEN_TTL so schema validation passes during build.
// Accept plain numbers from the shell (e.g. 900) by treating them as seconds.
if (!process.env.AUTH_TOKEN_TTL) {
  process.env.AUTH_TOKEN_TTL = "15m";
} else if (/^\d+$/.test(process.env.AUTH_TOKEN_TTL)) {
  process.env.AUTH_TOKEN_TTL = `${process.env.AUTH_TOKEN_TTL}s`;
}
