/**
 * LAUNCH-09: Extended Secrets Registry
 *
 * Comprehensive secrets management for the launch pipeline.
 * Provides:
 * - Secret definitions with metadata (rotation, validation)
 * - Per-shop secret requirements
 * - Runtime validation utilities
 * - Secret provisioning helpers
 */

export {
  DEPLOY_SECRET_REQUIREMENTS,
  type DeploySecretRequirements,
  type DeployTarget,
  // Secret generation
  generateSecretValue,
  generateSessionSecret,
  generateWebhookSecret,
  getExpiringSecrets,
  getRequiredSecretsForDeploy,
  getRequiredSecretsForShop,
  // Functions
  getSecretDefinition,
  getSecretsByCategory,
  isSecretExpiring,
  // Registry
  SECRET_REGISTRY,
  type SecretCategory,
  // Types
  type SecretDefinition,
  type SecretRequirement,
  type SecretRotationPolicy,
  type SecretValidationResult,
  type SecretValidationRule,
  type ShopSecretOverride,
  validateSecret,
  validateSecrets,
  validateShopSecrets,
} from "./registry";
export {
  // Runtime validation
  createSecretValidator,
  type EnvValidationResult,
  redactSecretValue,
  type SecretValidator,
  validateEnvSecrets,
} from "./validation";
