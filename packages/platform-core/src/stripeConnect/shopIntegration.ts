/**
 * LAUNCH-22: Stripe Connect Shop Integration
 *
 * Links shops to connected accounts and manages payment configuration.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { DATA_ROOT } from "../dataRoot";

import {
  type AccountLinkResult,
  type ConnectedAccount,
  createAccountLink,
  createConnectedAccount,
  getConnectedAccount,
  isAccountReady,
  type OnboardingOptions,
} from "./accounts";

// ============================================================
// Types
// ============================================================

/**
 * Shop's Stripe Connect configuration.
 */
export interface ShopConnectConfig {
  /** Connected account ID (acct_xxx) */
  connectedAccountId?: string;
  /** Account type */
  accountType: "express" | "standard" | "custom" | "none";
  /** Platform fee configuration */
  platformFee: {
    /** Fee type */
    type: "percentage" | "fixed" | "none";
    /** Fee value (percentage or cents) */
    value: number;
    /** Minimum fee in cents */
    minimum?: number;
    /** Maximum fee in cents */
    maximum?: number;
  };
  /** Payment configuration */
  payments: {
    /** Whether to use automatic payouts */
    automaticPayouts: boolean;
    /** Payout schedule */
    payoutSchedule: "daily" | "weekly" | "monthly" | "manual";
    /** Statement descriptor */
    statementDescriptor?: string;
    /** Statement descriptor suffix */
    statementDescriptorSuffix?: string;
  };
  /** Onboarding status */
  onboarding: {
    /** Whether onboarding is complete */
    complete: boolean;
    /** When onboarding started */
    startedAt?: string;
    /** When onboarding completed */
    completedAt?: string;
    /** Pending requirements */
    pendingRequirements: string[];
  };
  /** Metadata */
  metadata: Record<string, string>;
}

/**
 * Default platform fee percentage.
 */
export const DEFAULT_PLATFORM_FEE_PERCENT = 5;

// ============================================================
// Shop Configuration
// ============================================================

/**
 * Get the path to a shop's Connect configuration file.
 */
function getShopConnectConfigPath(shopId: string): string {
  return join(DATA_ROOT, "shops", shopId, "stripe-connect.json");
}

/**
 * Load a shop's Connect configuration.
 */
function loadShopConnectConfig(shopId: string): ShopConnectConfig | null {
  const configPath = getShopConnectConfigPath(shopId);
  if (!existsSync(configPath)) {
    return null;
  }

  const content = readFileSync(configPath, "utf8");
  return JSON.parse(content);
}

/**
 * Save a shop's Connect configuration.
 */
function saveShopConnectConfig(shopId: string, config: ShopConnectConfig): void {
  const configPath = getShopConnectConfigPath(shopId);
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}

/**
 * Create default Connect configuration for a shop.
 */
function createDefaultConfig(): ShopConnectConfig {
  return {
    accountType: "none",
    platformFee: {
      type: "percentage",
      value: DEFAULT_PLATFORM_FEE_PERCENT,
    },
    payments: {
      automaticPayouts: true,
      payoutSchedule: "daily",
    },
    onboarding: {
      complete: false,
      pendingRequirements: [],
    },
    metadata: {},
  };
}

// ============================================================
// Account Linking
// ============================================================

/**
 * Link a shop to a connected account.
 * Creates a new account if one doesn't exist.
 */
export async function linkShopToConnectedAccount(
  shopId: string,
  options: OnboardingOptions & {
    platformFeePercent?: number;
  }
): Promise<{
  account: ConnectedAccount;
  accountLink?: AccountLinkResult;
  config: ShopConnectConfig;
}> {
  // Load or create config
  let config = loadShopConnectConfig(shopId) || createDefaultConfig();

  // Check if already linked
  if (config.connectedAccountId) {
    const existingAccount = await getConnectedAccount(config.connectedAccountId);
    if (existingAccount) {
      // Check if needs to continue onboarding
      const ready = await isAccountReady(config.connectedAccountId);
      let accountLink: AccountLinkResult | undefined;

      if (!ready) {
        accountLink = await createAccountLink(config.connectedAccountId, {
          refreshUrl: `${options.businessProfile?.url || ""}/connect/refresh`,
          returnUrl: `${options.businessProfile?.url || ""}/connect/complete`,
          type: "account_onboarding",
        });
      }

      return {
        account: existingAccount,
        accountLink,
        config,
      };
    }
  }

  // Create new connected account
  const account = await createConnectedAccount({
    ...options,
    metadata: {
      ...options.metadata,
      shopId,
      platform: "base-shop",
    },
  });

  // Update config
  config = {
    ...config,
    connectedAccountId: account.id,
    accountType: options.type || "express",
    platformFee: {
      type: "percentage",
      value: options.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT,
    },
    onboarding: {
      complete: false,
      startedAt: new Date().toISOString(),
      pendingRequirements: account.onboarding.currentlyDue,
    },
    metadata: {
      ...config.metadata,
      createdAt: new Date().toISOString(),
    },
  };

  // Create account link for onboarding
  const accountLink = await createAccountLink(account.id, {
    refreshUrl: `${options.businessProfile?.url || ""}/connect/refresh`,
    returnUrl: `${options.businessProfile?.url || ""}/connect/complete`,
    type: "account_onboarding",
  });

  // Save config
  saveShopConnectConfig(shopId, config);

  return {
    account,
    accountLink,
    config,
  };
}

/**
 * Unlink a shop from its connected account.
 * Does not delete the Stripe account.
 */
export async function unlinkShopFromConnectedAccount(
  shopId: string
): Promise<void> {
  const config = loadShopConnectConfig(shopId);
  if (!config) return;

  // Clear the connection but preserve history in metadata
  const updatedConfig: ShopConnectConfig = {
    ...createDefaultConfig(),
    metadata: {
      ...config.metadata,
      previousAccountId: config.connectedAccountId || "",
      unlinkedAt: new Date().toISOString(),
    },
  };

  saveShopConnectConfig(shopId, updatedConfig);
}

/**
 * Get the connected account for a shop.
 */
export async function getShopConnectedAccount(
  shopId: string
): Promise<{
  account: ConnectedAccount | null;
  config: ShopConnectConfig;
  isReady: boolean;
}> {
  const config = loadShopConnectConfig(shopId) || createDefaultConfig();

  if (!config.connectedAccountId) {
    return {
      account: null,
      config,
      isReady: false,
    };
  }

  const account = await getConnectedAccount(config.connectedAccountId);
  const isReady = account ? await isAccountReady(config.connectedAccountId) : false;

  // Update onboarding status in config
  if (account) {
    config.onboarding = {
      ...config.onboarding,
      complete: isReady,
      completedAt: isReady && !config.onboarding.completedAt
        ? new Date().toISOString()
        : config.onboarding.completedAt,
      pendingRequirements: account.onboarding.currentlyDue,
    };
    saveShopConnectConfig(shopId, config);
  }

  return {
    account,
    config,
    isReady,
  };
}

/**
 * Update a shop's Connect configuration.
 */
export async function updateShopConnectConfig(
  shopId: string,
  updates: Partial<Omit<ShopConnectConfig, "connectedAccountId" | "onboarding">>
): Promise<ShopConnectConfig> {
  const config = loadShopConnectConfig(shopId);
  if (!config) {
    throw new Error(`Shop ${shopId} has no Connect configuration`);
  }

  const updatedConfig: ShopConnectConfig = {
    ...config,
    ...updates,
    platformFee: updates.platformFee
      ? { ...config.platformFee, ...updates.platformFee }
      : config.platformFee,
    payments: updates.payments
      ? { ...config.payments, ...updates.payments }
      : config.payments,
    metadata: {
      ...config.metadata,
      ...updates.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  saveShopConnectConfig(shopId, updatedConfig);
  return updatedConfig;
}

/**
 * Calculate the platform fee for a transaction.
 */
export function calculateShopPlatformFee(
  shopId: string,
  amount: number
): number {
  const config = loadShopConnectConfig(shopId);
  if (!config || config.platformFee.type === "none") {
    return 0;
  }

  let fee: number;

  if (config.platformFee.type === "percentage") {
    fee = Math.round((amount * config.platformFee.value) / 100);
  } else {
    fee = config.platformFee.value;
  }

  // Apply min/max bounds
  if (config.platformFee.minimum !== undefined) {
    fee = Math.max(fee, config.platformFee.minimum);
  }
  if (config.platformFee.maximum !== undefined) {
    fee = Math.min(fee, config.platformFee.maximum);
  }

  return fee;
}

/**
 * Check if a shop has a connected account and is ready for payments.
 */
export async function isShopConnectReady(shopId: string): Promise<boolean> {
  const { isReady } = await getShopConnectedAccount(shopId);
  return isReady;
}

/**
 * Get onboarding URL for a shop's connected account.
 */
export async function getShopOnboardingUrl(
  shopId: string,
  baseUrl: string
): Promise<string | null> {
  const { account, config } = await getShopConnectedAccount(shopId);

  if (!account || !config.connectedAccountId) {
    return null;
  }

  const link = await createAccountLink(config.connectedAccountId, {
    refreshUrl: `${baseUrl}/connect/refresh`,
    returnUrl: `${baseUrl}/connect/complete`,
    type: "account_onboarding",
  });

  return link.url;
}
