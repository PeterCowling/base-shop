// src/config/baseUrl.ts
// Resolve the public-facing base URL consistently in both browser and Node.
// Priority:
//   1) PUBLIC_BASE_URL (explicit override)
//   2) VITE_SITE_DOMAIN (canonical; Cloudflare Pages)
//   3) VITE_PUBLIC_DOMAIN / VITE_DOMAIN (historical fallbacks)
//   4) Platform previews (Netlify/Vercel)
//   5) Fallback production domain

import { DOMAIN as CONFIG_DOMAIN } from "@ui/config";

const FALLBACK = CONFIG_DOMAIN ?? "https://hostel-positano.com";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function readEnv(name: string): string | undefined {
  // Prefer Vite env when available, then process.env for Node contexts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- UI-1000 [ttl=2026-12-31] `import.meta.env` is untyped in some runtimes; narrow safely at call sites
  const viteEnv = (typeof import.meta !== "undefined" && (import.meta as any).env)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- UI-1000 [ttl=2026-12-31] `import.meta.env` is untyped in some runtimes; narrow safely at call sites
      (import.meta as any).env[name]
    : undefined;

  const nodeEnv = typeof process !== "undefined" ? process.env[name] : undefined;
  return viteEnv ?? nodeEnv ?? undefined;
}

function ensureHttps(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function normaliseCandidate(candidate: string | undefined): string | undefined {
  const ensured = ensureHttps(candidate);
  if (!ensured) return undefined;

  try {
    const hostname = new URL(ensured).hostname.toLowerCase();
    if (LOOPBACK_HOSTS.has(hostname)) return undefined;
  } catch {
    // If parsing fails, fall back to the ensured value with trailing slash trimmed.
    return ensured.replace(/\/$/, "");
  }

  return ensured.replace(/\/$/, "");
}

export function resolveBaseUrl(): string {
  const explicit = normaliseCandidate(readEnv("PUBLIC_BASE_URL"));
  if (explicit) return explicit;

  // Prefer explicit environment variables regardless of NODE_ENV or window origin
  const viteSite = normaliseCandidate(readEnv("VITE_SITE_DOMAIN"));
  if (viteSite) return viteSite;

  const vitePublic = normaliseCandidate(readEnv("VITE_PUBLIC_DOMAIN"));
  if (vitePublic) return vitePublic;

  const viteDomain = normaliseCandidate(readEnv("VITE_DOMAIN"));
  if (viteDomain) return viteDomain;

  // Common CI/hosting envs
  const netlify = normaliseCandidate(readEnv("URL") || readEnv("DEPLOY_PRIME_URL"));
  if (netlify) return netlify;

  const vercelHost = normaliseCandidate(readEnv("VERCEL_URL")); // e.g. my-app.vercel.app
  if (vercelHost) return vercelHost;

  return FALLBACK;
}

export const BASE_URL: string = resolveBaseUrl();
