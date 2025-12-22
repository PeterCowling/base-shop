// src/lib/cfLibImage.ts
/* -------------------------------------------------------------------------- */
/*  Cloudflare Image Resizing URL builder – free Transformations‑only tier     */
/* -------------------------------------------------------------------------- */
/*
   WHAT CHANGED & WHY
   ───────────────────────────────────────────────────────────────────────────
   1.  **No more baked‑in pages.dev hostnames.**
       • Absolute URLs are produced only when you _explicitly_ set an env var
         (NEXT_PUBLIC_SITE_ORIGIN / NEXT_PUBLIC_SITE_DOMAIN) – perfect for
         Production & Preview.
       • Everywhere else we fall back to _relative_ paths or
         `window.location.origin`, so staging / preview domains “just work”.

   2.  **Configurable by environment**
       • Production   → `NEXT_PUBLIC_SITE_DOMAIN=hostel-positano.com`
       • Preview      → `NEXT_PUBLIC_SITE_DOMAIN=staging.hostel-positano.com`
       • Local dev    → leave unset → relative paths.

   3.  **Type safety & refactor**
       • Behaviour under `IS_DEV` is unchanged – the dev server
         receives the raw path so it can serve assets directly.
*/

import { IS_DEV, SITE_DOMAIN, SITE_ORIGIN } from "@/config/env";

export interface BuildCfImageOptions {
  width?: number; // px
  height?: number; // px
  quality?: number; // 1‑100  (default 85)
  format?: string; // "auto" | "webp" | …
  fit?: string; // "cover" | "contain" | …
  blur?: number; // Gaussian blur radius
  [key: string]: string | number | undefined; // forward‑compat
}

/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                          */
/* -------------------------------------------------------------------------- */

const DEFAULT_QUALITY = 85;
const DEFAULT_FORMAT = "auto";

/**
 * Decide which origin to prefix:
 *   1. Explicit env var (NEXT_PUBLIC_SITE_ORIGIN / NEXT_PUBLIC_SITE_DOMAIN)
 *   2. hostOverride (unit tests / prerender)
 *   3. Browser at runtime → window.location.origin
 *   4. Empty string → relative URL (works everywhere)
 */
function getSiteOrigin(hostOverride?: string): string {
  const envOrigin = SITE_ORIGIN ?? SITE_DOMAIN ?? "";

  if (envOrigin) return stripProto(envOrigin);
  if (hostOverride) return stripProto(hostOverride);

  // Runtime in the browser
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  // SSR / build with no host → relative paths
  return "";
}

function stripProto(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function toOptionsString(opts: BuildCfImageOptions): string {
  if (opts.quality === undefined) opts.quality = DEFAULT_QUALITY;
  if (opts.format === undefined) opts.format = DEFAULT_FORMAT;

  return Object.entries(opts)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Build a Cloudflare Image Resizing URL.
 *
 * @param pathOrUrl   Relative path ("/img/foo.webp") **or** absolute URL.
 * @param opts        Transform options – width, quality, etc.
 * @param hostOverride  Tests / SSR only – forces a host.
 */
export default function buildCfImageUrl(
  pathOrUrl: string,
  opts: BuildCfImageOptions = {},
  hostOverride?: string,
): string {
  /* Dev‑server passthrough ─────────────────────────────────────────────── */
  if (IS_DEV) return pathOrUrl;

  /* 1. Serialise transform options ─────────────────────────────────────── */
  const optionString = toOptionsString({ ...opts });

  /* 2. Normalise source path ───────────────────────────────────────────── */
  const isRemote = /^https?:\/\//i.test(pathOrUrl);
  const srcPath = isRemote ? pathOrUrl : pathOrUrl.replace(/^\/+/, "");

  /* 3. Assemble final URL ──────────────────────────────────────────────── */
  const origin = getSiteOrigin(hostOverride);
  return origin
    ? `https://${origin}/cdn-cgi/image/${optionString}/${srcPath}`
    : `/cdn-cgi/image/${optionString}/${srcPath}`;
}
