/**
 * pmOrderDualWrite — fire-and-forget order write to Payment Manager.
 *
 * Called from `checkoutSession.server.ts` after the idempotency gate passes.
 * Must never throw into the caller's critical path.
 *
 * Usage:
 *   void pmOrderDualWrite(data).catch((err) =>
 *     console.warn("[pm_dual_write_failed]", err)
 *   );
 *
 * If PAYMENT_MANAGER_SERVICE_URL is not set, the write is silently skipped.
 * If CARYINA_INTERNAL_TOKEN is not set, the write is silently skipped.
 * Both errors are logged at warn level; checkout proceeds normally.
 */

export interface PmOrderWriteInput {
  id: string;
  shopId: string;
  provider: string;
  status?: string;
  amountCents: number;
  currency?: string;
  customerEmail?: string;
  providerOrderId?: string;
  lineItemsJson?: unknown;
}

export async function pmOrderDualWrite(input: PmOrderWriteInput): Promise<void> {
  const pmUrl = process.env.PAYMENT_MANAGER_SERVICE_URL?.trim();
  if (!pmUrl) {
    // Not configured — silently skip. This is normal before PM is deployed.
    return;
  }

  const internalToken = process.env.CARYINA_INTERNAL_TOKEN?.trim();
  if (!internalToken) {
    // Token not configured — log and skip.
    console.warn("[pm_dual_write] CARYINA_INTERNAL_TOKEN not set — skipping PM order write"); // i18n-exempt -- developer log
    return;
  }

  const url = `${pmUrl}/api/internal/orders`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${internalToken}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "(no body)");
    throw new Error(
      `PM order write failed: HTTP ${response.status} — ${text}`, // i18n-exempt -- developer error
    );
  }
}
