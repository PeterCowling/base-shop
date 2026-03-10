// apps/xa/next.config.mjs

import sharedConfig from "@acme/next-config/next.config.mjs";

process.env.CMS_SPACE_URL ??= "https://cms.example.com";
process.env.CMS_ACCESS_TOKEN ??= "placeholder-token";
process.env.SANITY_API_VERSION ??= "2021-10-21";
process.env.EMAIL_PROVIDER ??= "noop";

const XA_IMAGES_BASE_URL = process.env.NEXT_PUBLIC_XA_IMAGES_BASE_URL ?? "";
const XA_STEALTH_MODE =
  process.env.NEXT_PUBLIC_STEALTH_MODE ??
  process.env.XA_STEALTH_MODE ??
  process.env.STEALTH_MODE ??
  "";
const XA_STEALTH_BRAND_NAME =
  process.env.NEXT_PUBLIC_STEALTH_BRAND_NAME ?? "Private preview";
const CONTRACT_ROUTE_ROOT_SEGMENTS = new Set(["catalog", "catalog-public", "drafts", "deploy", "upload"]);
const XA_IMAGES_HOSTNAME = (() => {
  try {
    return new URL(XA_IMAGES_BASE_URL).hostname;
  } catch {
    return null;
  }
})();

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function resolveContractRoot(baseUrl) {
  const base = new URL(ensureTrailingSlash(baseUrl));
  const segments = base.pathname.split("/").filter(Boolean);
  const routeRootIndex = segments.findIndex((segment) => CONTRACT_ROUTE_ROOT_SEGMENTS.has(segment));
  const rootSegments = routeRootIndex < 0 ? segments : segments.slice(0, routeRootIndex);
  base.pathname = rootSegments.length > 0 ? `/${rootSegments.join("/")}/` : "/";
  base.search = "";
  base.hash = "";
  return base;
}

function resolveCatalogPublicUrl() {
  const explicit = (process.env.NEXT_PUBLIC_XA_CATALOG_PUBLIC_URL ?? "").trim();
  if (explicit) return explicit;

  const readUrl = (process.env.XA_CATALOG_CONTRACT_READ_URL ?? "").trim();
  if (readUrl) {
    try {
      const parsed = new URL(readUrl);
      parsed.pathname = parsed.pathname.replace(/\/catalog\//u, "/catalog-public/");
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    } catch {
      return "";
    }
  }

  const baseUrl = (process.env.XA_CATALOG_CONTRACT_BASE_URL ?? "").trim();
  if (!baseUrl) return "";
  try {
    const root = resolveContractRoot(baseUrl);
    return new URL("catalog-public/xa-b", root).toString();
  } catch {
    return "";
  }
}

const XA_CATALOG_PUBLIC_URL = resolveCatalogPublicUrl();

export default {
  ...sharedConfig,
  poweredByHeader: false,
  env: {
    ...(sharedConfig.env ?? {}),
    NEXT_PUBLIC_STEALTH_MODE: XA_STEALTH_MODE,
    NEXT_PUBLIC_STEALTH_BRAND_NAME: XA_STEALTH_BRAND_NAME,
    NEXT_PUBLIC_XA_CATALOG_PUBLIC_URL: XA_CATALOG_PUBLIC_URL,
  },
  images: {
    ...sharedConfig.images,
    unoptimized: true,
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
  output: "export",
};
