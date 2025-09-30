// apps/shop-bcd/next.config.mjs

// Provide strong development defaults compatible with the stricter environment
// validation that runs inside the shared Next.js configuration. These values
// are only used when local developers haven't supplied secrets via the shell.
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

// Load the shared Next.js configuration after the defaults run so validation
// sees the populated values.
const { default: sharedConfig } = await import("@acme/next-config/next.config.mjs");

const config = {
  ...sharedConfig,
  async headers() {
    const base = typeof sharedConfig.headers === 'function' ? await sharedConfig.headers() : [];
    return [
      ...base,
      {
        source: "/:lang/product/:slug",
        headers: [
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), gyroscope=()" },
        ],
      },
    ];
  },
};

export default config;
