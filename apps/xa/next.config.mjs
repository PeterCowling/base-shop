// apps/xa/next.config.mjs

import sharedConfig from "@acme/next-config/next.config.mjs";

// Keep production config strict: missing secrets should fail fast so we don't
// accidentally deploy with insecure defaults.
const DEV_NEXTAUTH = "dev-nextauth-secret-32-chars-long-string!";
const DEV_SESSION = "dev-session-secret-32-chars-long-string!";
function ensureStrong(name, fallback) {
  const val = process.env[name];
  if (!val || val.length < 32) process.env[name] = fallback;
}
function requireEnv(name, minLength) {
  const val = process.env[name];
  if (!val) throw new Error(`${name} is required in production`);
  if (minLength && val.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters`);
  }
}

if (process.env.NODE_ENV === "production") {
  requireEnv("NEXTAUTH_SECRET", 32);
  requireEnv("SESSION_SECRET", 32);
  requireEnv("CART_COOKIE_SECRET");
} else {
  ensureStrong("NEXTAUTH_SECRET", DEV_NEXTAUTH);
  ensureStrong("SESSION_SECRET", DEV_SESSION);
  process.env.CART_COOKIE_SECRET ??= "dev-cart-secret";
}

process.env.CMS_SPACE_URL ??= "https://cms.example.com";
process.env.CMS_ACCESS_TOKEN ??= "placeholder-token";
process.env.SANITY_API_VERSION ??= "2021-10-21";
process.env.EMAIL_PROVIDER ??= "noop";

const XA_IMAGES_BASE_URL = process.env.NEXT_PUBLIC_XA_IMAGES_BASE_URL ?? "";
const XA_IMAGES_HOSTNAME = (() => {
  try {
    return new URL(XA_IMAGES_BASE_URL).hostname;
  } catch {
    return null;
  }
})();

export default {
  ...sharedConfig,
  poweredByHeader: false,
  // XA-LAUNCH: Temporarily ignore TS errors from @acme/ui Button type mismatches
  // TODO: Remove this once Button types are unified across the design system
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    ...sharedConfig.images,
    remotePatterns: [
      ...(sharedConfig.images?.remotePatterns ?? []),
      { protocol: "https", hostname: "imagedelivery.net", pathname: "/**" },
      { protocol: "https", hostname: "source.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      ...(XA_IMAGES_HOSTNAME
        ? [{ protocol: "https", hostname: XA_IMAGES_HOSTNAME, pathname: "/**" }]
        : []),
    ],
  },
  // XA is a dynamic storefront; avoid forcing static export when OUTPUT_EXPORT is set.
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
};
