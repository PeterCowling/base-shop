import "server-only";

import { sendSystemEmail } from "@acme/platform-core/email";
import { releaseInventoryHold } from "@acme/platform-core/inventoryHolds";
import { recordMetric } from "@acme/platform-core/utils";

import {
  type CheckoutAttemptRecord,
  listStaleInProgressCheckoutAttempts,
  markCheckoutAttemptResult,
} from "./checkoutIdempotency.server";

export type CheckoutReconciliationSummary = {
  scanned: number;
  released: number;
  failedWithoutHold: number;
  needsReview: number;
  errors: number;
};

function merchantAlertEmail(): string {
  return process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com";
}

async function sendCheckoutAlert(subject: string, html: string): Promise<void> {
  try {
    await sendSystemEmail({ to: merchantAlertEmail(), subject, html });
  } catch (err) {
    console.error("Checkout alert email failed", err); // i18n-exempt -- developer log
  }
}

function buildNeedsReviewHtml(
  record: CheckoutAttemptRecord,
  reason: string,
): string {
  return `
    <h2>Checkout reconciliation needs review</h2>
    <p><strong>Reason:</strong> ${reason}</p>
    <p><strong>Idempotency key:</strong> ${record.idempotencyKey}</p>
    <p><strong>Hold ID:</strong> ${record.holdId ?? "(none)"}</p>
    <p><strong>Transaction reference:</strong> ${record.shopTransactionId ?? "(none)"}</p>
    <p><strong>Payment attempted at:</strong> ${record.paymentAttemptedAt ?? "(unknown)"}</p>
    <p><strong>Updated at:</strong> ${record.updatedAt}</p>
  `;
}

export async function reconcileStaleCheckoutAttempts(params: {
  shopId: string;
  staleMinutes?: number;
  maxAttempts?: number;
}): Promise<CheckoutReconciliationSummary> {
  const staleMinutes = Math.max(1, Math.floor(params.staleMinutes ?? 15));
  const maxAttempts = Math.max(1, Math.floor(params.maxAttempts ?? 25));
  const staleBefore = new Date(Date.now() - staleMinutes * 60 * 1000);

  const stale = await listStaleInProgressCheckoutAttempts({
    shopId: params.shopId,
    staleBefore,
  });
  const queue = stale.slice(0, maxAttempts);

  const summary: CheckoutReconciliationSummary = {
    scanned: queue.length,
    released: 0,
    failedWithoutHold: 0,
    needsReview: 0,
    errors: 0,
  };

  for (const attempt of queue) {
    try {
      if (
        attempt.provider === "stripe" &&
        typeof attempt.stripeSessionExpiresAt === "string" &&
        attempt.stripeSessionExpiresAt > new Date().toISOString()
      ) {
        continue;
      }

      if (attempt.paymentAttemptedAt) {
        summary.needsReview += 1;
        await markCheckoutAttemptResult({
          shopId: params.shopId,
          idempotencyKey: attempt.idempotencyKey,
          status: "needs_review",
          responseStatus: 503,
          responseBody: {
            error: "Checkout requires manual reconciliation",
            code: "checkout_needs_review",
          },
          errorCode: "checkout_needs_review",
          errorMessage: "Stale checkout attempt after payment attempt",
        });
        recordMetric("caryina_checkout_reconciliation_total", {
          shopId: params.shopId,
          service: "caryina",
          status: "failure",
          outcome: "needs_review",
        });
        await sendCheckoutAlert(
          `[ALERT] Caryina checkout needs review: ${attempt.idempotencyKey}`,
          buildNeedsReviewHtml(attempt, "stale_after_payment_attempt"),
        );
        continue;
      }

      if (!attempt.holdId) {
        summary.failedWithoutHold += 1;
        await markCheckoutAttemptResult({
          shopId: params.shopId,
          idempotencyKey: attempt.idempotencyKey,
          status: "failed",
          responseStatus: 503,
          responseBody: {
            error: "Checkout expired. Please retry.",
            code: "checkout_reconciled_stale",
          },
          errorCode: "checkout_reconciled_stale",
          errorMessage: "Stale checkout attempt without hold",
        });
        recordMetric("caryina_checkout_reconciliation_total", {
          shopId: params.shopId,
          service: "caryina",
          status: "success",
          outcome: "failed_without_hold",
        });
        continue;
      }

      const release = await releaseInventoryHold({
        shopId: params.shopId,
        holdId: attempt.holdId,
        reason: "checkout_reconciliation_stale",
      });

      if (!release.ok && release.reason === "committed") {
        summary.needsReview += 1;
        await markCheckoutAttemptResult({
          shopId: params.shopId,
          idempotencyKey: attempt.idempotencyKey,
          status: "needs_review",
          responseStatus: 503,
          responseBody: {
            error: "Checkout requires manual reconciliation",
            code: "checkout_needs_review",
          },
          errorCode: "checkout_needs_review",
          errorMessage: "Hold already committed for stale in-progress attempt",
        });
        recordMetric("caryina_checkout_reconciliation_total", {
          shopId: params.shopId,
          service: "caryina",
          status: "failure",
          outcome: "needs_review",
        });
        await sendCheckoutAlert(
          `[ALERT] Caryina checkout needs review: ${attempt.idempotencyKey}`,
          buildNeedsReviewHtml(attempt, "hold_already_committed"),
        );
        continue;
      }

      summary.released += 1;
      await markCheckoutAttemptResult({
        shopId: params.shopId,
        idempotencyKey: attempt.idempotencyKey,
        status: "failed",
        responseStatus: 503,
        responseBody: {
          error: "Checkout expired. Please retry.",
          code: "checkout_reconciled_stale",
        },
        errorCode: "checkout_reconciled_stale",
        errorMessage: "Stale checkout attempt released",
      });
      recordMetric("caryina_checkout_reconciliation_total", {
        shopId: params.shopId,
        service: "caryina",
        status: "success",
        outcome: "released",
      });
    } catch (err) {
      summary.errors += 1;
      recordMetric("caryina_checkout_reconciliation_total", {
        shopId: params.shopId,
        service: "caryina",
        status: "failure",
        outcome: "error",
      });
      console.error("Checkout reconciliation failure", { attempt, err }); // i18n-exempt -- developer log
    }
  }

  return summary;
}
