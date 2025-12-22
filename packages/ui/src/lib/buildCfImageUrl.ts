// file path: src/lib/buildCfImageUrl.ts
/* -------------------------------------------------------------------------- */
/*  Cloudflare Image Resizing URL builder – canonical implementation          */
/* -------------------------------------------------------------------------- */
export interface BuildCfImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  fit?: string;
  blur?: number;
  [key: string]: string | number | undefined;
}

const DEFAULT_QUALITY = 85;
const DEFAULT_FORMAT = "auto";
const FALLBACK_ORIGIN = "https://hostel-positano.com"; // keeps SSR prerender happy

const stripProto = (u: string): string => u.replace(/^https?:\/\//, "").replace(/\/+$/, "");

function getSiteOrigin(hostOverride?: string): string {
  const envOrigin =
    import.meta.env.SITE_ORIGIN ||
    import.meta.env.VITE_SITE_ORIGIN ||
    import.meta.env.VITE_SITE_DOMAIN ||
    "";

  if (envOrigin) return stripProto(envOrigin);
  if (hostOverride) return stripProto(hostOverride);

  /* During SSR prerender there is no window – fall back to a hard origin
     so images become absolute and bypass the internal router. */
  if (import.meta.env.SSR) return stripProto(FALLBACK_ORIGIN);

  /* Runtime in the browser */
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "";
}

function toOptionsString(opts: BuildCfImageOptions): string {
  if (opts.quality === undefined) opts.quality = DEFAULT_QUALITY;
  if (opts.format === undefined) opts.format = DEFAULT_FORMAT;

  return Object.entries(opts)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
}

export function buildCfImageUrl(
  pathOrUrl: string,
  opts: BuildCfImageOptions = {},
  hostOverride?: string
): string {
  if (import.meta.env.DEV) return pathOrUrl;

  const params = toOptionsString({ ...opts });
  const isRemote = /^https?:\/\//i.test(pathOrUrl);
  const srcPath = isRemote ? pathOrUrl : pathOrUrl.replace(/^\/+/, "");

  const origin = getSiteOrigin(hostOverride);
  return origin
    ? `https://${origin}/cdn-cgi/image/${params}/${srcPath}`
    : `/cdn-cgi/image/${params}/${srcPath}`;
}

export default buildCfImageUrl;
