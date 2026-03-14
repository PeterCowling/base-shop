import "server-only";

import { createHash } from "crypto";

import { prisma } from "@acme/platform-core/db";

// ---------------------------------------------------------------------------
// Types (preserved from original — callers depend on these exports)
// ---------------------------------------------------------------------------

type CheckoutAttemptStatus =
  | "in_progress"
  | "finalizing"
  | "succeeded"
  | "failed"
  | "needs_review";

type ReplayBody = Record<string, unknown>;

export interface CheckoutAttemptRecord {
  idempotencyKey: string;
  requestHash: string;
  status: CheckoutAttemptStatus;
  createdAt: string;
  updatedAt: string;
  acceptedLegalTerms?: boolean;
  acceptedLegalTermsAt?: string;
  provider?: "axerve" | "stripe";
  shopTransactionId?: string;
  holdId?: string;
  cartId?: string;
  lang?: string;
  buyerName?: string;
  buyerEmail?: string;
  paymentAttemptedAt?: string;
  stripeSessionId?: string;
  stripeSessionExpiresAt?: string;
  stripePaymentIntentId?: string;
  responseStatus?: number;
  responseBody?: ReplayBody;
  errorCode?: string;
  errorMessage?: string;
}

export type BeginCheckoutAttemptResult =
  | { kind: "acquired"; record: CheckoutAttemptRecord }
  | {
      kind: "replay";
      record: CheckoutAttemptRecord;
      responseStatus: number;
      responseBody: ReplayBody;
    }
  | { kind: "in_progress"; record: CheckoutAttemptRecord }
  | { kind: "conflict"; record: CheckoutAttemptRecord };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a Prisma CheckoutAttempt row to CheckoutAttemptRecord */
function toRecord(row: {
  idempotencyKey: string;
  requestHash: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  acceptedLegalTerms: boolean | null;
  acceptedLegalTermsAt: Date | null;
  provider: string | null;
  shopTransactionId: string | null;
  holdId: string | null;
  cartId: string | null;
  lang: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  paymentAttemptedAt: Date | null;
  stripeSessionId: string | null;
  stripeSessionExpiresAt: Date | null;
  stripePaymentIntentId: string | null;
  responseStatus: number | null;
  responseBody: unknown;
  errorCode: string | null;
  errorMessage: string | null;
}): CheckoutAttemptRecord {
  return {
    idempotencyKey: row.idempotencyKey,
    requestHash: row.requestHash,
    status: row.status as CheckoutAttemptStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    acceptedLegalTerms: row.acceptedLegalTerms ?? undefined,
    acceptedLegalTermsAt: row.acceptedLegalTermsAt?.toISOString(),
    provider: (row.provider as "axerve" | "stripe" | null) ?? undefined,
    shopTransactionId: row.shopTransactionId ?? undefined,
    holdId: row.holdId ?? undefined,
    cartId: row.cartId ?? undefined,
    lang: row.lang ?? undefined,
    buyerName: row.buyerName ?? undefined,
    buyerEmail: row.buyerEmail ?? undefined,
    paymentAttemptedAt: row.paymentAttemptedAt?.toISOString(),
    stripeSessionId: row.stripeSessionId ?? undefined,
    stripeSessionExpiresAt: row.stripeSessionExpiresAt?.toISOString(),
    stripePaymentIntentId: row.stripePaymentIntentId ?? undefined,
    responseStatus: row.responseStatus ?? undefined,
    responseBody: (row.responseBody as ReplayBody) ?? undefined,
    errorCode: row.errorCode ?? undefined,
    errorMessage: row.errorMessage ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a SHA-256 hash of the checkout request payload.
 * Uses Node.js `crypto` module (available under `nodejs_compat` flag).
 */
export function buildCheckoutRequestHash(payload: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * Acquire or check an existing checkout attempt for the given idempotency key.
 *
 * - `acquired`:   New record created; caller may proceed with checkout.
 * - `replay`:     Existing terminal record with same requestHash — return stored response.
 * - `in_progress`: Duplicate in-flight request; caller should return 409.
 * - `conflict`:   Different requestHash for same key; caller should return 422.
 *
 * Atomicity: Prisma `create` + P2002 catch replaces the fs exclusive-lock pattern.
 */
export async function beginCheckoutAttempt(params: {
  shopId: string;
  idempotencyKey: string;
  requestHash: string;
  now?: Date;
}): Promise<BeginCheckoutAttemptResult> {
  const now = params.now ?? new Date();

  // Optimistic create: will throw P2002 on duplicate (shopId, idempotencyKey).
  try {
    const row = await prisma.checkoutAttempt.create({
      data: {
        shopId: params.shopId,
        idempotencyKey: params.idempotencyKey,
        requestHash: params.requestHash,
        status: "in_progress",
        createdAt: now,
        updatedAt: now,
      },
    });
    return { kind: "acquired", record: toRecord(row) };
  } catch (err) {
    // P2002 = unique constraint violation — record already exists
    const isUniqueViolation =
      err instanceof Error && "code" in err && (err as { code: string }).code === "P2002";
    if (!isUniqueViolation) throw err;
  }

  // Re-read the existing record
  const existing = await prisma.checkoutAttempt.findUnique({
    where: { shopId_idempotencyKey: { shopId: params.shopId, idempotencyKey: params.idempotencyKey } },
  });
  if (!existing) {
    // Race: deleted between create and findUnique — treat as conflict
    throw new Error("Checkout attempt disappeared after unique violation — unexpected race"); // i18n-exempt -- developer error
  }

  const record = toRecord(existing);

  if (existing.requestHash !== params.requestHash) {
    return { kind: "conflict", record };
  }

  if (existing.status === "in_progress" || existing.status === "finalizing") {
    return { kind: "in_progress", record };
  }

  // Terminal status with same requestHash → replay
  return {
    kind: "replay",
    record,
    responseStatus: existing.responseStatus ?? 500,
    responseBody:
      (existing.responseBody as ReplayBody) ??
      ({ error: "Stored checkout outcome unavailable" } as ReplayBody),
  };
}

export async function markCheckoutAttemptReservation(params: {
  shopId: string;
  idempotencyKey: string;
  holdId: string;
  shopTransactionId: string;
  acceptedLegalTerms: boolean;
  acceptedLegalTermsAt: string;
  provider: "axerve" | "stripe";
  cartId?: string;
  lang?: string;
  buyerName?: string;
  buyerEmail?: string;
  now?: Date;
}): Promise<void> {
  await prisma.checkoutAttempt.updateMany({
    where: { shopId: params.shopId, idempotencyKey: params.idempotencyKey },
    data: {
      holdId: params.holdId,
      shopTransactionId: params.shopTransactionId,
      acceptedLegalTerms: params.acceptedLegalTerms,
      acceptedLegalTermsAt: new Date(params.acceptedLegalTermsAt),
      provider: params.provider,
      cartId: params.cartId ?? null,
      lang: params.lang ?? null,
      buyerName: params.buyerName ?? null,
      buyerEmail: params.buyerEmail ?? null,
      updatedAt: params.now ?? new Date(),
    },
  });
}

export async function recordCheckoutAttemptStripeSession(params: {
  shopId: string;
  idempotencyKey: string;
  stripeSessionId: string;
  stripeSessionExpiresAt: string;
  now?: Date;
}): Promise<void> {
  await prisma.checkoutAttempt.updateMany({
    where: { shopId: params.shopId, idempotencyKey: params.idempotencyKey },
    data: {
      provider: "stripe",
      stripeSessionId: params.stripeSessionId,
      stripeSessionExpiresAt: new Date(params.stripeSessionExpiresAt),
      updatedAt: params.now ?? new Date(),
    },
  });
}

export async function markCheckoutAttemptPaymentAttempted(params: {
  shopId: string;
  idempotencyKey: string;
  now?: Date;
}): Promise<void> {
  const now = params.now ?? new Date();
  await prisma.checkoutAttempt.updateMany({
    where: { shopId: params.shopId, idempotencyKey: params.idempotencyKey },
    data: {
      paymentAttemptedAt: now,
      updatedAt: now,
    },
  });
}

export async function markCheckoutAttemptResult(params: {
  shopId: string;
  idempotencyKey: string;
  status: Exclude<CheckoutAttemptStatus, "in_progress">;
  responseStatus: number;
  responseBody: ReplayBody;
  errorCode?: string;
  errorMessage?: string;
  now?: Date;
}): Promise<void> {
  await prisma.checkoutAttempt.updateMany({
    where: { shopId: params.shopId, idempotencyKey: params.idempotencyKey },
    data: {
      status: params.status,
      responseStatus: params.responseStatus,
      responseBody: params.responseBody,
      errorCode: params.errorCode ?? null,
      errorMessage: params.errorMessage ?? null,
      updatedAt: params.now ?? new Date(),
    },
  });
}

export async function beginStripeCheckoutFinalization(params: {
  shopId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  now?: Date;
}): Promise<
  | { kind: "acquired"; record: CheckoutAttemptRecord }
  | { kind: "busy"; record: CheckoutAttemptRecord }
  | { kind: "already_finalized"; record: CheckoutAttemptRecord }
  | { kind: "no_match" }
> {
  const now = params.now ?? new Date();

  const existing = await prisma.checkoutAttempt.findFirst({
    where: { shopId: params.shopId, stripeSessionId: params.stripeSessionId },
  });
  if (!existing) {
    return { kind: "no_match" };
  }

  if (existing.status === "succeeded" || existing.status === "failed" || existing.status === "needs_review") {
    return { kind: "already_finalized", record: toRecord(existing) };
  }

  if (existing.status === "finalizing") {
    return { kind: "busy", record: toRecord(existing) };
  }

  // Transition in_progress → finalizing atomically
  const updated = await prisma.checkoutAttempt.update({
    where: { id: existing.id },
    data: {
      status: "finalizing",
      stripePaymentIntentId: params.stripePaymentIntentId ?? existing.stripePaymentIntentId,
      updatedAt: now,
    },
  });
  return { kind: "acquired", record: toRecord(updated) };
}

export async function findCheckoutAttemptByStripeSessionId(params: {
  shopId: string;
  stripeSessionId: string;
}): Promise<CheckoutAttemptRecord | undefined> {
  const row = await prisma.checkoutAttempt.findFirst({
    where: { shopId: params.shopId, stripeSessionId: params.stripeSessionId },
  });
  return row ? toRecord(row) : undefined;
}

export async function findCheckoutAttemptByShopTransactionId(params: {
  shopId: string;
  shopTransactionId: string;
}): Promise<CheckoutAttemptRecord | undefined> {
  const row = await prisma.checkoutAttempt.findFirst({
    where: { shopId: params.shopId, shopTransactionId: params.shopTransactionId },
  });
  return row ? toRecord(row) : undefined;
}

export async function listStaleInProgressCheckoutAttempts(params: {
  shopId: string;
  staleBefore: Date;
}): Promise<CheckoutAttemptRecord[]> {
  const rows = await prisma.checkoutAttempt.findMany({
    where: {
      shopId: params.shopId,
      status: { in: ["in_progress", "finalizing"] },
      updatedAt: { lt: params.staleBefore },
    },
  });
  return rows.map(toRecord);
}
