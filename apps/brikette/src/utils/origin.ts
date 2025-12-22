// src/utils/origin.ts
// -----------------------------------------------------------------------------
// Helpers for working with browser origins consistently across runtimes.
// -----------------------------------------------------------------------------

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

/**
 * Normalise a browser origin for use in canonical URLs and meta tags.
 *
 * - Drops default ports (80/443) when they are explicitly provided.
 * - Removes any dev-server port when running on localhost / loopback hosts.
 * - Returns the original value for malformed inputs so callers can fall back.
 */
export function normaliseBrowserOrigin(origin: string): string {
  if (!origin) return origin;

  try {
    const url = new URL(origin);
    const isDefaultPort =
      (url.protocol === "http:" && url.port === "80") ||
      (url.protocol === "https:" && url.port === "443");
    const host = url.hostname;
    const isLocalHost = LOCAL_HOSTS.has(host);

    if (url.port && (isDefaultPort || isLocalHost)) {
      url.port = "";
    }

    return url.origin;
  } catch {
    // If the origin cannot be parsed keep the original string – callers may
    // decide to fall back to the configured DOMAIN instead.
    return origin;
  }
}
