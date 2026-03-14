import "server-only";

import { paymentsEnv } from "@acme/config/env/payments";

export type CaryinaPaymentProvider = "axerve" | "stripe";

const SHOP_ID = "caryina";
const PM_BASE_URL = process.env.PAYMENT_MANAGER_URL ?? "";
const PM_INTERNAL_TOKEN = process.env.PAYMENT_MANAGER_INTERNAL_TOKEN ?? "";

/**
 * Phase 3: Reads the active payment provider from Payment Manager's
 * internal shop-config endpoint, falling back to the local env var when:
 *   - PAYMENT_MANAGER_URL or PAYMENT_MANAGER_INTERNAL_TOKEN is unset
 *   - The PM request fails (network error, timeout, non-OK response)
 *   - PM returns a value not in the known-provider set
 *
 * This function is async due to the remote fetch but callers should treat it
 * as a lightweight call — PM caches config in its DB and the response is fast.
 *
 * Caryina checkout callers:
 *   - apps/caryina/src/lib/checkoutSession.server.ts
 *   - apps/caryina/src/app/[lang]/checkout/page.tsx
 */
export async function resolveCaryinaPaymentProvider(): Promise<CaryinaPaymentProvider> {
  // --- Phase 3: Fetch from Payment Manager if configured ---
  if (PM_BASE_URL && PM_INTERNAL_TOKEN) {
    try {
      const url = `${PM_BASE_URL}/api/internal/shop-config?shopId=${encodeURIComponent(SHOP_ID)}`;
      const res = await fetch(url, {
        headers: { "x-internal-token": PM_INTERNAL_TOKEN },
        // Next.js fetch cache: revalidate every 60 seconds (KV-equivalent caching at request level)
        next: { revalidate: 60 },
        // Abort after 8 s to prevent Caryina checkout from hanging on a slow PM response.
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = (await res.json()) as { activeProvider?: unknown };
        const provider = data.activeProvider;
        if (provider === "axerve" || provider === "stripe") {
          return provider;
        }
        // "disabled" or unexpected value → fall through to env-var fallback
      }
    } catch {
      // Network failure or timeout — silently fall through to env-var fallback.
      // Checkout must not be blocked by a transient PM outage.
    }
  }

  // --- Env-var fallback (Phase 1 / PM unavailable) ---
  return paymentsEnv.PAYMENTS_PROVIDER ?? "axerve";
}

export function isAxerveProvider(provider: CaryinaPaymentProvider): boolean {
  return provider === "axerve";
}
