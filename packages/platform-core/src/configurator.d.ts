/**
 * Read the contents of an environment file into a key/value map.
 * Empty values and comments are ignored.
 * @param file Path to the .env file.
 */
export declare function readEnvFile(file: string): Record<string, string>;
/**
 * Validate that an environment file exists and conforms to the schema defined above.
 * Throws if validation fails.
 * @param file Path to the .env file.
 */
export declare function validateEnvFile(file: string): void;
/**
 * Validate the environment file for a given shop. Looks up the file in apps/{shop}/.env.
 * @param shop Identifier of the shop whose environment should be validated.
 */
export declare function validateShopEnv(shop: string): void;
export declare const pluginEnvVars: Record<string, readonly string[]>;
export type ConfigCheckResult =
  | { ok: true }
  | {
      ok: false;
      reason: string;
      details?: unknown;
    };
export type ConfigCheck = (shopId: string) => Promise<ConfigCheckResult>;
export declare const checkShopBasics: ConfigCheck;
export declare const checkTheme: ConfigCheck;
export declare const checkPayments: ConfigCheck;
export declare const checkShippingTax: ConfigCheck;
export declare const checkCheckout: ConfigCheck;
export declare const checkProductsInventory: ConfigCheck;
export declare const checkNavigationHome: ConfigCheck;
import type { ConfiguratorStepId } from "@acme/types";
export declare const configuratorChecks: Partial<
  Record<ConfiguratorStepId, ConfigCheck>
>;
