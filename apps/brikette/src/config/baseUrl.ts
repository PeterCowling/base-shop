// src/config/baseUrl.ts
// Resolve the public-facing base URL consistently in both browser and Node.
// Priority:
//   1) NEXT_PUBLIC_BASE_URL (explicit override)
//   2) NEXT_PUBLIC_SITE_DOMAIN (canonical; Cloudflare Pages)
//   3) NEXT_PUBLIC_PUBLIC_DOMAIN / NEXT_PUBLIC_DOMAIN (historical fallbacks)
//   4) Platform previews (Netlify/Vercel)
//   5) Fallback production domain

import { DOMAIN as CONFIG_DOMAIN } from "@/config";
import { FALLBACK_DOMAIN, PUBLIC_BASE_URL, PUBLIC_DOMAIN, SITE_DOMAIN } from "@/config/env";

const FALLBACK = CONFIG_DOMAIN ?? FALLBACK_DOMAIN ?? "https://hostel-positano.com";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function readNodeEnv(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env[name] : undefined;
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
  const explicit = normaliseCandidate(PUBLIC_BASE_URL);
  if (explicit) return explicit;

  // Prefer explicit environment variables regardless of NODE_ENV or window origin
  const siteDomain = normaliseCandidate(SITE_DOMAIN);
  if (siteDomain) return siteDomain;

  const publicDomain = normaliseCandidate(PUBLIC_DOMAIN);
  if (publicDomain) return publicDomain;

  const fallbackDomain = normaliseCandidate(FALLBACK_DOMAIN);
  if (fallbackDomain) return fallbackDomain;

  // Common CI/hosting envs
  const netlify = normaliseCandidate(readNodeEnv("URL") || readNodeEnv("DEPLOY_PRIME_URL"));
  if (netlify) return netlify;

  const vercelHost = normaliseCandidate(readNodeEnv("VERCEL_URL")); // e.g. my-app.vercel.app
  if (vercelHost) return vercelHost;

  return FALLBACK;
}

export const BASE_URL: string = resolveBaseUrl();
