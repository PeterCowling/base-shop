/**
 * Safe webhook utility for forwarding data to external URLs.
 * Includes SSRF protection and request timeouts.
 *
 * @module safeWebhook
 */

/** Default timeout for webhook requests (5 seconds) */
const DEFAULT_TIMEOUT_MS = 5000;

/** Maximum retries for failed requests */
const MAX_RETRIES = 2;

/** Base delay for exponential backoff (ms) */
const BACKOFF_BASE_MS = 100;

/** Maximum backoff delay (ms) */
const MAX_BACKOFF_MS = 500;

/**
 * IPv4 private network ranges that should be blocked.
 * Includes loopback, private, link-local, and cloud metadata IPs.
 */
const BLOCKED_IPV4_PATTERNS = [
  /^127\./, // Loopback (127.0.0.0/8)
  /^10\./, // Private Class A (10.0.0.0/8)
  /^192\.168\./, // Private Class C (192.168.0.0/16)
  /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B (172.16.0.0/12)
  /^169\.254\./, // Link-local (169.254.0.0/16) - includes AWS metadata
  /^0\./, // Current network (0.0.0.0/8)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // Carrier-grade NAT (100.64.0.0/10)
  /^192\.0\.0\./, // IETF protocol assignments (192.0.0.0/24)
  /^192\.0\.2\./, // TEST-NET-1 (192.0.2.0/24)
  /^198\.51\.100\./, // TEST-NET-2 (198.51.100.0/24)
  /^203\.0\.113\./, // TEST-NET-3 (203.0.113.0/24)
  /^224\./, // Multicast (224.0.0.0/4)
  /^240\./, // Reserved (240.0.0.0/4)
];

/**
 * Hostnames that should always be blocked (cloud metadata services, etc.)
 */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  // AWS metadata service
  "169.254.169.254",
  // GCP metadata service
  "metadata.google.internal",
  "metadata",
  // Azure metadata service
  "169.254.169.254", // Same as AWS
  // Kubernetes service discovery
  "kubernetes",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

/**
 * Check if a hostname is an IPv6 loopback address.
 */
function isIPv6Loopback(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return normalized === "::1" || normalized === "0:0:0:0:0:0:0:1";
}

/**
 * Check if a URL targets a private/internal network.
 * Returns true if the URL should be blocked.
 *
 * @param url - The URL to validate
 * @returns true if the URL targets a private/internal network
 */
export function isPrivateURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return true;
    }

    // Check IPv6 loopback
    if (isIPv6Loopback(hostname)) {
      return true;
    }

    // Check IPv4 private ranges
    for (const pattern of BLOCKED_IPV4_PATTERNS) {
      if (pattern.test(hostname)) {
        return true;
      }
    }

    // Block non-HTTP(S) protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return true;
    }

    return false;
  } catch {
    // Malformed URLs are treated as private (reject by default)
    return true;
  }
}

/**
 * Options for safe webhook fetch.
 */
export interface SafeWebhookOptions extends Omit<RequestInit, "signal"> {
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Number of retries on failure (default: 2) */
  retries?: number;
  /** Whether to skip private IP validation (DANGEROUS - use only in tests) */
  _skipPrivateIPCheck?: boolean;
}

/**
 * Result of a safe webhook fetch.
 */
export interface SafeWebhookResult {
  /** Whether the request succeeded */
  ok: boolean;
  /** HTTP status code (0 if request failed to connect) */
  status: number;
  /** Error message if request failed */
  error?: string;
  /** Number of attempts made */
  attempts: number;
}

/**
 * Safely fetch a webhook URL with SSRF protection and timeouts.
 *
 * Features:
 * - Blocks requests to private/internal IPs (SSRF protection)
 * - Configurable timeout (default 5 seconds)
 * - Automatic retries with exponential backoff
 * - Proper abort signal handling
 *
 * @param url - The webhook URL to fetch
 * @param options - Fetch options plus timeout/retry configuration
 * @returns Result object with success status and any errors
 *
 * @example
 * ```typescript
 * const result = await safeWebhookFetch("https://webhook.example.com/lead", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({ name: "John", email: "john@example.com" }),
 *   timeout: 3000,
 * });
 *
 * if (!result.ok) {
 *   console.error(`Webhook failed: ${result.error}`);
 * }
 * ```
 */
export async function safeWebhookFetch(
  url: string,
  options: SafeWebhookOptions = {},
): Promise<SafeWebhookResult> {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    retries = MAX_RETRIES,
    _skipPrivateIPCheck = false,
    ...fetchOptions
  } = options;

  // SSRF protection: block private/internal URLs
  if (!_skipPrivateIPCheck && isPrivateURL(url)) {
    return {
      ok: false,
      status: 0,
      error: "Cannot forward to private/internal endpoint",
      attempts: 0,
    };
  }

  let lastError: string | undefined;
  let attempts = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    attempts++;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          attempts,
        };
      }

      lastError = `HTTP ${response.status}`;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          lastError = `Request timeout (${timeout}ms)`;
        } else {
          lastError = err.message;
        }
      } else {
        lastError = "Unknown error";
      }
    }

    // Exponential backoff before retry (except on last attempt)
    if (attempt < retries) {
      const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    ok: false,
    status: 0,
    error: lastError,
    attempts,
  };
}
