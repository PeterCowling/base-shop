import "server-only";

import { prisma } from "./db";
import { validateShopName } from "./shops";

export type ReconciliationIngestInput = {
  shopId: string;
  sessionId: string;
  source: string;
  requestId?: string;
  currency: string;
  amountTotalMinor: number;
  normalizationApplied: boolean;
  payload: unknown;
};

export async function recordReconciliationIngest(
  input: ReconciliationIngestInput,
): Promise<void> {
  const shop = validateShopName(input.shopId);
  const sessionId = input.sessionId.trim();
  if (!sessionId) {
    throw new Error("Missing session id"); // i18n-exempt -- internal error message
  }

  const source = input.source.trim();
  if (!source) {
    throw new Error("Missing source"); // i18n-exempt -- internal error message
  }

  if (
    typeof input.amountTotalMinor !== "number" ||
    !Number.isFinite(input.amountTotalMinor) ||
    !Number.isInteger(input.amountTotalMinor)
  ) {
    throw new Error("Invalid amountTotalMinor"); // i18n-exempt -- internal error message
  }

  const currency = input.currency.trim().toUpperCase();
  if (!currency) {
    throw new Error("Missing currency"); // i18n-exempt -- internal error message
  }

  await prisma.reconciliationIngest.create({
    data: {
      shop,
      sessionId,
      source,
      requestId: input.requestId?.trim() ? input.requestId.trim() : undefined,
      currency,
      amountTotalMinor: input.amountTotalMinor,
      normalizationApplied: Boolean(input.normalizationApplied),
      payload: input.payload,
    },
  });
}

