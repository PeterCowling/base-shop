/**
 * LAUNCH-22: Stripe Connect Account Management
 *
 * Handles connected account lifecycle:
 * - Account creation (Express, Standard, Custom)
 * - Onboarding flow
 * - Capability management
 * - Transfer and payout operations
 */

import Stripe from "stripe";

import { stripe } from "@acme/stripe";

// ============================================================
// Types
// ============================================================

/**
 * Type of Stripe Connect account.
 */
export type AccountType = "express" | "standard" | "custom";

/**
 * Account capability status.
 */
export type AccountCapability =
  | "card_payments"
  | "transfers"
  | "tax_reporting_us_1099_k"
  | "tax_reporting_us_1099_misc";

/**
 * Onboarding status for a connected account.
 */
export interface AccountOnboardingStatus {
  /** Whether basic details are submitted */
  detailsSubmitted: boolean;
  /** Whether payouts are enabled */
  payoutsEnabled: boolean;
  /** Whether charges are enabled */
  chargesEnabled: boolean;
  /** Pending requirements */
  currentlyDue: string[];
  /** Eventually due requirements */
  eventuallyDue: string[];
  /** Past due requirements */
  pastDue: string[];
  /** Verification status */
  verification: {
    status: "unverified" | "pending" | "verified";
    disabledReason?: string;
  };
}

/**
 * Connected account representation.
 */
export interface ConnectedAccount {
  /** Stripe account ID (acct_xxx) */
  id: string;
  /** Account type */
  type: AccountType;
  /** Business profile */
  businessProfile: {
    name?: string;
    url?: string;
    supportEmail?: string;
    supportPhone?: string;
  };
  /** Country code */
  country: string;
  /** Default currency */
  defaultCurrency: string;
  /** Email address */
  email?: string;
  /** Onboarding status */
  onboarding: AccountOnboardingStatus;
  /** Enabled capabilities */
  capabilities: Partial<Record<AccountCapability, "active" | "inactive" | "pending">>;
  /** Metadata */
  metadata: Record<string, string>;
  /** Creation timestamp */
  created: Date;
}

/**
 * Options for creating a connected account.
 */
export interface OnboardingOptions {
  /** Account type (default: express) */
  type?: AccountType;
  /** Country code */
  country: string;
  /** Email address */
  email?: string;
  /** Business type */
  businessType?: "individual" | "company" | "non_profit" | "government_entity";
  /** Business profile */
  businessProfile?: {
    name?: string;
    url?: string;
    supportEmail?: string;
    supportPhone?: string;
    mcc?: string;
  };
  /** Requested capabilities */
  capabilities?: AccountCapability[];
  /** Metadata to attach */
  metadata?: Record<string, string>;
  /** Terms of service acceptance */
  tosAcceptance?: {
    date: number;
    ip: string;
    userAgent?: string;
  };
}

/**
 * Result of creating an account link.
 */
export interface AccountLinkResult {
  /** URL to redirect the user to */
  url: string;
  /** When the link expires */
  expiresAt: Date;
}

/**
 * Payment split configuration.
 */
export interface PaymentSplitConfig {
  /** Connected account to receive funds */
  destinationAccount: string;
  /** Amount to transfer (in cents) */
  amount: number;
  /** Platform fee (in cents) */
  platformFee?: number;
  /** Platform fee percentage (0-100) */
  platformFeePercent?: number;
  /** Transfer group for linking related transfers */
  transferGroup?: string;
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * Transfer result.
 */
export interface TransferResult {
  /** Transfer ID */
  id: string;
  /** Amount transferred (cents) */
  amount: number;
  /** Currency */
  currency: string;
  /** Destination account */
  destination: string;
  /** Transfer status */
  status: "pending" | "paid" | "failed" | "canceled";
  /** Creation timestamp */
  created: Date;
}

// ============================================================
// Account Management
// ============================================================

/**
 * Create a new connected account.
 */
export async function createConnectedAccount(
  options: OnboardingOptions
): Promise<ConnectedAccount> {
  // Use imported stripe client

  const capabilities: Stripe.AccountCreateParams.Capabilities = {};
  for (const cap of options.capabilities || ["card_payments", "transfers"]) {
    capabilities[cap as keyof Stripe.AccountCreateParams.Capabilities] = {
      requested: true,
    };
  }

  const account = await stripe.accounts.create({
    type: options.type || "express",
    country: options.country,
    email: options.email,
    business_type: options.businessType,
    business_profile: options.businessProfile
      ? {
          name: options.businessProfile.name,
          url: options.businessProfile.url,
          support_email: options.businessProfile.supportEmail,
          support_phone: options.businessProfile.supportPhone,
          mcc: options.businessProfile.mcc,
        }
      : undefined,
    capabilities,
    metadata: options.metadata,
    tos_acceptance: options.tosAcceptance
      ? {
          date: options.tosAcceptance.date,
          ip: options.tosAcceptance.ip,
          user_agent: options.tosAcceptance.userAgent,
        }
      : undefined,
  });

  return mapStripeAccount(account);
}

/**
 * Get a connected account by ID.
 */
export async function getConnectedAccount(
  accountId: string
): Promise<ConnectedAccount | null> {
  // Use imported stripe client

  try {
    const account = await stripe.accounts.retrieve(accountId);
    return mapStripeAccount(account);
  } catch (error) {
    if (
      error instanceof Stripe.errors.StripeError &&
      error.code === "account_invalid"
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Update a connected account.
 */
export async function updateConnectedAccount(
  accountId: string,
  updates: Partial<OnboardingOptions>
): Promise<ConnectedAccount> {
  // Use imported stripe client

  const account = await stripe.accounts.update(accountId, {
    email: updates.email,
    business_profile: updates.businessProfile
      ? {
          name: updates.businessProfile.name,
          url: updates.businessProfile.url,
          support_email: updates.businessProfile.supportEmail,
          support_phone: updates.businessProfile.supportPhone,
          mcc: updates.businessProfile.mcc,
        }
      : undefined,
    metadata: updates.metadata,
  });

  return mapStripeAccount(account);
}

/**
 * Delete a connected account.
 */
export async function deleteConnectedAccount(accountId: string): Promise<void> {
  // Use imported stripe client
  await stripe.accounts.del(accountId);
}

/**
 * List connected accounts with optional filtering.
 */
export async function listConnectedAccounts(options?: {
  limit?: number;
  startingAfter?: string;
}): Promise<{ accounts: ConnectedAccount[]; hasMore: boolean }> {
  // Use imported stripe client

  const result = await stripe.accounts.list({
    limit: options?.limit || 10,
    starting_after: options?.startingAfter,
  });

  return {
    accounts: result.data.map(mapStripeAccount),
    hasMore: result.has_more,
  };
}

// ============================================================
// Onboarding
// ============================================================

/**
 * Create an account link for onboarding.
 */
export async function createAccountLink(
  accountId: string,
  options: {
    refreshUrl: string;
    returnUrl: string;
    type?: "account_onboarding" | "account_update";
  }
): Promise<AccountLinkResult> {
  // Use imported stripe client

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: options.refreshUrl,
    return_url: options.returnUrl,
    type: options.type || "account_onboarding",
  });

  return {
    url: link.url,
    expiresAt: new Date(link.expires_at * 1000),
  };
}

/**
 * Get onboarding status for an account.
 */
export async function getOnboardingStatus(
  accountId: string
): Promise<AccountOnboardingStatus | null> {
  const account = await getConnectedAccount(accountId);
  return account?.onboarding || null;
}

/**
 * Check if an account is ready to receive payments.
 */
export async function isAccountReady(accountId: string): Promise<boolean> {
  const account = await getConnectedAccount(accountId);
  if (!account) return false;

  return (
    account.onboarding.chargesEnabled &&
    account.onboarding.payoutsEnabled &&
    account.onboarding.detailsSubmitted
  );
}

// ============================================================
// Payments with Splits
// ============================================================

/**
 * Create a payment intent with platform fee and transfer to connected account.
 */
export async function createPaymentWithSplit(
  amount: number,
  currency: string,
  split: PaymentSplitConfig,
  options?: {
    customer?: string;
    paymentMethodTypes?: string[];
    metadata?: Record<string, string>;
    statementDescriptor?: string;
    receiptEmail?: string;
  }
): Promise<Stripe.PaymentIntent> {
  // Use imported stripe client

  // Calculate platform fee
  let applicationFeeAmount: number | undefined;
  if (split.platformFee !== undefined) {
    applicationFeeAmount = split.platformFee;
  } else if (split.platformFeePercent !== undefined) {
    applicationFeeAmount = Math.round((amount * split.platformFeePercent) / 100);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: options?.customer,
    payment_method_types: options?.paymentMethodTypes || ["card"],
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: split.destinationAccount,
      amount: split.amount,
    },
    transfer_group: split.transferGroup,
    metadata: {
      ...options?.metadata,
      ...split.metadata,
    },
    statement_descriptor: options?.statementDescriptor,
    receipt_email: options?.receiptEmail,
  });

  return paymentIntent;
}

/**
 * Calculate platform fee for an amount.
 */
export function calculatePlatformFee(
  amount: number,
  feePercent: number
): number {
  return Math.round((amount * feePercent) / 100);
}

// ============================================================
// Transfers
// ============================================================

/**
 * Create a transfer to a connected account.
 */
export async function createTransfer(
  amount: number,
  currency: string,
  destination: string,
  options?: {
    sourceTransaction?: string;
    transferGroup?: string;
    description?: string;
    metadata?: Record<string, string>;
  }
): Promise<TransferResult> {
  // Use imported stripe client

  const transfer = await stripe.transfers.create({
    amount,
    currency,
    destination,
    source_transaction: options?.sourceTransaction,
    transfer_group: options?.transferGroup,
    description: options?.description,
    metadata: options?.metadata,
  });

  return mapStripeTransfer(transfer);
}

/**
 * Create a payout to a connected account's external account.
 */
export async function createPayout(
  accountId: string,
  amount: number,
  currency: string,
  options?: {
    method?: "standard" | "instant";
    destination?: string;
    description?: string;
    metadata?: Record<string, string>;
  }
): Promise<{ id: string; status: string; arrivalDate: Date }> {
  // Use imported stripe client

  const payout = await stripe.payouts.create(
    {
      amount,
      currency,
      method: options?.method || "standard",
      destination: options?.destination,
      description: options?.description,
      metadata: options?.metadata,
    },
    {
      stripeAccount: accountId,
    }
  );

  return {
    id: payout.id,
    status: payout.status,
    arrivalDate: new Date(payout.arrival_date * 1000),
  };
}

/**
 * Get a transfer by ID.
 */
export async function getTransfer(transferId: string): Promise<TransferResult | null> {
  // Use imported stripe client

  try {
    const transfer = await stripe.transfers.retrieve(transferId);
    return mapStripeTransfer(transfer);
  } catch {
    return null;
  }
}

/**
 * List transfers with optional filtering.
 */
export async function listTransfers(options?: {
  destination?: string;
  transferGroup?: string;
  limit?: number;
  startingAfter?: string;
}): Promise<{ transfers: TransferResult[]; hasMore: boolean }> {
  // Use imported stripe client

  const result = await stripe.transfers.list({
    destination: options?.destination,
    transfer_group: options?.transferGroup,
    limit: options?.limit || 10,
    starting_after: options?.startingAfter,
  });

  return {
    transfers: result.data.map(mapStripeTransfer),
    hasMore: result.has_more,
  };
}

// ============================================================
// Helpers
// ============================================================

function mapStripeAccount(account: Stripe.Account): ConnectedAccount {
  // Type the requirements properly - Stripe types it as {} but it has these fields
  const requirements = account.requirements as {
    currently_due?: string[];
    eventually_due?: string[];
    past_due?: string[];
    disabled_reason?: string | null;
  } | null;

  return {
    id: account.id,
    type: account.type as AccountType,
    businessProfile: {
      name: account.business_profile?.name || undefined,
      url: account.business_profile?.url || undefined,
      supportEmail: account.business_profile?.support_email || undefined,
      supportPhone: account.business_profile?.support_phone || undefined,
    },
    country: account.country || "US",
    defaultCurrency: account.default_currency || "usd",
    email: account.email || undefined,
    onboarding: {
      detailsSubmitted: account.details_submitted || false,
      payoutsEnabled: account.payouts_enabled || false,
      chargesEnabled: account.charges_enabled || false,
      currentlyDue: requirements?.currently_due || [],
      eventuallyDue: requirements?.eventually_due || [],
      pastDue: requirements?.past_due || [],
      verification: {
        status: account.charges_enabled
          ? "verified"
          : (requirements?.currently_due?.length ?? 0) > 0
            ? "pending"
            : "unverified",
        disabledReason: requirements?.disabled_reason || undefined,
      },
    },
    capabilities: account.capabilities || {},
    metadata: (account.metadata as Record<string, string>) || {},
    created: new Date((account.created ?? Date.now() / 1000) * 1000),
  };
}

function mapStripeTransfer(transfer: Stripe.Transfer): TransferResult {
  return {
    id: transfer.id,
    amount: transfer.amount,
    currency: transfer.currency,
    destination:
      typeof transfer.destination === "string"
        ? transfer.destination
        : transfer.destination?.id || "",
    status: transfer.reversed
      ? "canceled"
      : transfer.amount === transfer.amount_reversed
        ? "failed"
        : "paid",
    created: new Date(transfer.created * 1000),
  };
}
