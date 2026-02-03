// apps/cover-me-pretty/next.config.mjs

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
// Sanity: provide safe defaults so env validation doesn't fail in CI/edge
process.env.SANITY_PROJECT_ID ??= "dummy-project-id";
process.env.SANITY_DATASET ??= "production";
process.env.SANITY_API_TOKEN ??= "dummy-api-token";
process.env.SANITY_PREVIEW_SECRET ??= "dummy-preview-secret";
// Email: default to noop provider during local builds so env validation passes
process.env.EMAIL_PROVIDER ??= "noop";
if (process.env.NODE_ENV !== "production") {
  process.env.INVENTORY_AUTHORITY_TOKEN ??= "dev-inventory-token";
}

// Load the shared Next.js configuration after the defaults run so validation
// sees the populated values.
const { default: sharedConfig } = await import("@acme/next-config/next.config.mjs");

const config = {
  ...sharedConfig,
  typescript: {
    tsconfigPath: "./tsconfig.next.json",
  },
  // Shop BCD should not be exported as static HTML when OUTPUT_EXPORT is set.
  // Override the shared `output: "export"` flag so dynamic API routes such as
  // `/api/collections/[id]` remain valid during workspace builds.
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
  async headers() {
    const base =
      typeof sharedConfig.headers === "function"
        ? await sharedConfig.headers()
        : [];
    return [
      ...base,
      {
        source: "/:lang/product/:slug",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), gyroscope=()",
          },
        ],
      },
    ];
  },
};

export default config;
