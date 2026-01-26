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

type ViteEnv = Partial<Record<"DEV" | "SSR" | "SITE_ORIGIN" | "VITE_SITE_ORIGIN" | "VITE_SITE_DOMAIN", string | boolean>>;

function getViteEnv(): ViteEnv | undefined {
  try {
    // eslint-disable-next-line no-eval -- UI-1000 [ttl=2026-12-31] eval avoids CJS parse errors for import.meta
    const meta = eval("import.meta") as { env?: ViteEnv } | undefined;
    return meta?.env;
  } catch {
    return undefined;
  }
}

function isDevMode(): boolean {
  const env = getViteEnv();
  const viteFlag = env?.DEV as boolean | undefined;
  return viteFlag ?? (typeof process !== "undefined" ? process.env.NODE_ENV !== "production" : false);
}

function isServerRuntime(): boolean {
  const env = getViteEnv();
  const viteFlag = env?.SSR as boolean | undefined;
  return viteFlag ?? (typeof window === "undefined");
}

function readEnv(name: keyof NonNullable<ViteEnv>): string | undefined {
  const env = getViteEnv();
  const viteValue = env?.[name];
  const nodeValue = typeof process !== "undefined" ? process.env[name] : undefined;
  return (typeof viteValue === "string" ? viteValue : undefined) ?? nodeValue ?? undefined;
}

function getSiteOrigin(hostOverride?: string): string {
  const envOrigin =
    readEnv("SITE_ORIGIN") ||
    readEnv("VITE_SITE_ORIGIN") ||
    readEnv("VITE_SITE_DOMAIN") ||
    "";

  if (envOrigin) return stripProto(envOrigin);
  if (hostOverride) return stripProto(hostOverride);

  /* During SSR prerender there is no window – fall back to a hard origin
     so images become absolute and bypass the internal router. */
  if (isServerRuntime()) return stripProto(FALLBACK_ORIGIN);

  /* Runtime in the browser */
  if (typeof window !== "undefined" && window.location?.origin) {
    return stripProto(window.location.origin);
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
  if (isDevMode()) return pathOrUrl;

  const params = toOptionsString({ ...opts });
  const isRemote = /^https?:\/\//i.test(pathOrUrl);
  const srcPath = isRemote ? pathOrUrl : pathOrUrl.replace(/^\/+/, "");

  const origin = getSiteOrigin(hostOverride);
  return origin
    ? `https://${origin}/cdn-cgi/image/${params}/${srcPath}`
    : `/cdn-cgi/image/${params}/${srcPath}`;
}

export default buildCfImageUrl;
