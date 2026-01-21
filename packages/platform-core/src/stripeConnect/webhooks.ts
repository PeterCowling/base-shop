/**
 * LAUNCH-22: Stripe Connect Webhook Handlers
 *
 * Handles Connect-specific webhook events:
 * - account.updated - Account status changes
 * - transfer.created - Transfer confirmations
 * - payout.paid - Successful payouts
 * - payout.failed - Failed payouts
 */

import type Stripe from "stripe";

import { safeError,safeLog, safeWarn } from "../logging/safeLogger";

// ============================================================
// Types
// ============================================================

/**
 * Connect-specific webhook event types.
 */
export type ConnectWebhookEvent =
  | "account.updated"
  | "account.application.authorized"
  | "account.application.deauthorized"
  | "account.external_account.created"
  | "account.external_account.deleted"
  | "account.external_account.updated"
  | "transfer.created"
  | "transfer.reversed"
  | "transfer.updated"
  | "payout.canceled"
  | "payout.created"
  | "payout.failed"
  | "payout.paid"
  | "payout.reconciliation_completed"
  | "payout.updated";

/**
 * Webhook handler function signature.
 */
export type ConnectWebhookHandler<T = Stripe.Event.Data.Object> = (
  event: Stripe.Event,
  data: T
) => Promise<WebhookHandlerResult>;

/**
 * Result from a webhook handler.
 */
export interface WebhookHandlerResult {
  /** Whether the event was handled successfully */
  success: boolean;
  /** Action taken */
  action?: string;
  /** Error message if failed */
  error?: string;
  /** Whether to retry */
  retry?: boolean;
}

/**
 * Account update event data.
 */
export interface AccountUpdateData {
  accountId: string;
  previousAttributes?: Record<string, unknown>;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    disabledReason?: string;
  };
}

/**
 * Transfer event data.
 */
export interface TransferData {
  transferId: string;
  amount: number;
  currency: string;
  destination: string;
  sourceTransaction?: string;
  transferGroup?: string;
  reversed: boolean;
}

/**
 * Payout event data.
 */
export interface PayoutData {
  payoutId: string;
  accountId: string;
  amount: number;
  currency: string;
  arrivalDate: Date;
  status: string;
  failureCode?: string;
  failureMessage?: string;
}

// ============================================================
// Event Handlers
// ============================================================

/**
 * Handle account.updated webhook event.
 * Triggered when a connected account's status changes.
 */
export async function handleAccountUpdated(
  event: Stripe.Event,
  callbacks?: {
    onAccountReady?: (accountId: string) => Promise<void>;
    onAccountDisabled?: (accountId: string, reason: string) => Promise<void>;
    onRequirementsChange?: (accountId: string, requirements: string[]) => Promise<void>;
  }
): Promise<WebhookHandlerResult> {
  const account = event.data.object as Stripe.Account;
  const previousAttributes = event.data.previous_attributes as
    | Record<string, unknown>
    | undefined;

  safeLog(`[Connect] Account updated: ${account.id}`, {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  });

  try {
    // Check if account just became ready
    const wasNotReady =
      previousAttributes &&
      (!previousAttributes.charges_enabled || !previousAttributes.payouts_enabled);
    const isNowReady = account.charges_enabled && account.payouts_enabled;

    if (wasNotReady && isNowReady) {
      safeLog(`[Connect] Account ${account.id} is now ready for payments`);
      if (callbacks?.onAccountReady) {
        await callbacks.onAccountReady(account.id);
      }
    }

    // Check if account was disabled
    const requirements = account.requirements;
    if (requirements?.disabled_reason) {
      safeWarn(`[Connect] Account ${account.id} disabled`, {
        reason: requirements.disabled_reason,
      });
      if (callbacks?.onAccountDisabled) {
        await callbacks.onAccountDisabled(
          account.id,
          requirements.disabled_reason
        );
      }
    }

    // Check for new requirements
    const newRequirements = requirements?.currently_due || [];
    if (newRequirements.length > 0) {
      safeLog(`[Connect] Account ${account.id} has new requirements`, {
        requirements: newRequirements,
      });
      if (callbacks?.onRequirementsChange) {
        await callbacks.onRequirementsChange(account.id, newRequirements);
      }
    }

    return {
      success: true,
      action: "account_status_updated",
    };
  } catch (error) {
    safeError(`[Connect] Failed to handle account.updated`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      retry: true,
    };
  }
}

/**
 * Handle transfer.created webhook event.
 * Triggered when a transfer to a connected account is created.
 */
export async function handleTransferCreated(
  event: Stripe.Event,
  callbacks?: {
    onTransferCreated?: (data: TransferData) => Promise<void>;
  }
): Promise<WebhookHandlerResult> {
  const transfer = event.data.object as Stripe.Transfer;

  safeLog(`[Connect] Transfer created: ${transfer.id}`, {
    amount: transfer.amount,
    currency: transfer.currency,
    destination:
      typeof transfer.destination === "string"
        ? transfer.destination
        : transfer.destination?.id,
  });

  try {
    const transferData: TransferData = {
      transferId: transfer.id,
      amount: transfer.amount,
      currency: transfer.currency,
      destination:
        typeof transfer.destination === "string"
          ? transfer.destination
          : transfer.destination?.id || "",
      sourceTransaction:
        typeof transfer.source_transaction === "string"
          ? transfer.source_transaction
          : transfer.source_transaction?.id,
      transferGroup: transfer.transfer_group || undefined,
      reversed: transfer.reversed,
    };

    if (callbacks?.onTransferCreated) {
      await callbacks.onTransferCreated(transferData);
    }

    return {
      success: true,
      action: "transfer_recorded",
    };
  } catch (error) {
    safeError(`[Connect] Failed to handle transfer.created`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      retry: true,
    };
  }
}

/**
 * Handle payout.paid webhook event.
 * Triggered when a payout to a connected account succeeds.
 */
export async function handlePayoutPaid(
  event: Stripe.Event,
  callbacks?: {
    onPayoutSuccess?: (data: PayoutData) => Promise<void>;
  }
): Promise<WebhookHandlerResult> {
  const payout = event.data.object as Stripe.Payout;

  safeLog(`[Connect] Payout paid: ${payout.id}`, {
    amount: payout.amount,
    currency: payout.currency,
    arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
  });

  try {
    const payoutData: PayoutData = {
      payoutId: payout.id,
      accountId: event.account || "",
      amount: payout.amount,
      currency: payout.currency,
      arrivalDate: new Date(payout.arrival_date * 1000),
      status: payout.status,
    };

    if (callbacks?.onPayoutSuccess) {
      await callbacks.onPayoutSuccess(payoutData);
    }

    return {
      success: true,
      action: "payout_recorded",
    };
  } catch (error) {
    safeError(`[Connect] Failed to handle payout.paid`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      retry: true,
    };
  }
}

/**
 * Handle payout.failed webhook event.
 * Triggered when a payout to a connected account fails.
 */
export async function handlePayoutFailed(
  event: Stripe.Event,
  callbacks?: {
    onPayoutFailure?: (data: PayoutData) => Promise<void>;
    sendAlert?: (accountId: string, message: string) => Promise<void>;
  }
): Promise<WebhookHandlerResult> {
  const payout = event.data.object as Stripe.Payout;

  safeWarn(`[Connect] Payout failed: ${payout.id}`, {
    amount: payout.amount,
    currency: payout.currency,
    failureCode: payout.failure_code,
    failureMessage: payout.failure_message,
  });

  try {
    const payoutData: PayoutData = {
      payoutId: payout.id,
      accountId: event.account || "",
      amount: payout.amount,
      currency: payout.currency,
      arrivalDate: new Date(payout.arrival_date * 1000),
      status: payout.status,
      failureCode: payout.failure_code || undefined,
      failureMessage: payout.failure_message || undefined,
    };

    if (callbacks?.onPayoutFailure) {
      await callbacks.onPayoutFailure(payoutData);
    }

    // Send alert for failed payouts
    if (callbacks?.sendAlert && event.account) {
      await callbacks.sendAlert(
        event.account,
        `Payout ${payout.id} failed: ${payout.failure_message || payout.failure_code || "Unknown error"}`
      );
    }

    return {
      success: true,
      action: "payout_failure_recorded",
    };
  } catch (error) {
    safeError(`[Connect] Failed to handle payout.failed`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      retry: true,
    };
  }
}

// ============================================================
// Event Router
// ============================================================

/**
 * Route a Connect webhook event to the appropriate handler.
 */
export async function routeConnectWebhook(
  event: Stripe.Event,
  handlers?: {
    onAccountReady?: (accountId: string) => Promise<void>;
    onAccountDisabled?: (accountId: string, reason: string) => Promise<void>;
    onRequirementsChange?: (accountId: string, requirements: string[]) => Promise<void>;
    onTransferCreated?: (data: TransferData) => Promise<void>;
    onPayoutSuccess?: (data: PayoutData) => Promise<void>;
    onPayoutFailure?: (data: PayoutData) => Promise<void>;
    sendAlert?: (accountId: string, message: string) => Promise<void>;
  }
): Promise<WebhookHandlerResult> {
  switch (event.type) {
    case "account.updated":
      return handleAccountUpdated(event, handlers);

    case "transfer.created":
      return handleTransferCreated(event, handlers);

    case "payout.paid":
      return handlePayoutPaid(event, handlers);

    case "payout.failed":
      return handlePayoutFailed(event, handlers);

    default:
      // Log unhandled Connect events for visibility
      safeLog(`[Connect] Unhandled event type: ${event.type}`);
      return {
        success: true,
        action: "event_acknowledged",
      };
  }
}
