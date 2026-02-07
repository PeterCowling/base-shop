/**
 * LAUNCH-22: Stripe Connect Implementation
 *
 * Provides connected account management for marketplace/platform setups:
 * - Account creation and onboarding
 * - Account link generation
 * - Payment splits and platform fees
 * - Transfer management
 * - Payout handling
 */

export {
  type AccountCapability,
  type AccountLinkResult,
  type AccountOnboardingStatus,
  type AccountType,
  calculatePlatformFee,
  // Types
  type ConnectedAccount,
  // Onboarding
  createAccountLink,
  // Account management
  createConnectedAccount,
  // Payments
  createPaymentWithSplit,
  createPayout,
  // Transfers
  createTransfer,
  deleteConnectedAccount,
  getConnectedAccount,
  getOnboardingStatus,
  getTransfer,
  isAccountReady,
  listConnectedAccounts,
  listTransfers,
  type OnboardingOptions,
  type PaymentSplitConfig,
  type TransferResult,
  updateConnectedAccount,
} from "./accounts";
export {
  DEFAULT_PLATFORM_FEE_PERCENT,
  getShopConnectedAccount,
  // Shop integration
  linkShopToConnectedAccount,
  // Configuration
  type ShopConnectConfig,
  unlinkShopFromConnectedAccount,
} from "./shopIntegration";
export {
  // Webhook types
  type ConnectWebhookEvent,
  type ConnectWebhookHandler,
  // Webhook handlers
  handleAccountUpdated,
  handlePayoutFailed,
  handlePayoutPaid,
  handleTransferCreated,
} from "./webhooks";
