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
//# sourceMappingURL=configurator.d.ts.map