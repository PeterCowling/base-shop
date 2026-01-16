/**
 * Inventory Authority Client
 *
 * Used by Cloudflare Workers and edge runtimes to validate inventory
 * against the centralized inventory authority (Node.js backend).
 *
 * Implements fail-closed policy: if the authority is unavailable,
 * validation fails to prevent overselling.
 */

export interface InventoryValidationRequest {
  sku: string;
  variantKey?: string;
  quantity: number;
}

export interface InventoryValidationResponse {
  ok: boolean;
  insufficient?: Array<{
    sku: string;
    variantKey: string;
    requested: number;
    available: number;
  }>;
}

export interface InventoryAuthorityClientOptions {
  baseUrl: string;
  token: string;
  timeout?: number;
}

export class InventoryAuthorityClient {
  private baseUrl: string;
  private token: string;
  private timeout: number;

  constructor(options: InventoryAuthorityClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.token = options.token;
    this.timeout = options.timeout ?? 5000; // Default 5 second timeout
  }

  /**
   * Validate inventory availability for a set of items
   *
   * @throws {Error} If the authority is unavailable (503) or network error
   * @returns {InventoryValidationResponse} Validation result
   */
  async validate(
    shopId: string,
    items: InventoryValidationRequest[]
  ): Promise<InventoryValidationResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shopId, items }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Service unavailable - fail closed
      if (response.status === 503) {
        throw new Error("Inventory authority unavailable");
      }

      // Unauthorized
      if (response.status === 401 || response.status === 403) {
        throw new Error("Inventory authority authentication failed");
      }

      // Insufficient inventory
      if (response.status === 409) {
        const error = await response.json();
        if (error.code === "inventory_insufficient") {
          return {
            ok: false,
            insufficient: error.items,
          };
        }
      }

      // Other errors
      if (!response.ok) {
        throw new Error(`Inventory validation failed: ${response.status}`);
      }

      return { ok: true };
    } catch (err) {
      clearTimeout(timeoutId);

      // Network timeout or abort
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Inventory authority timeout");
      }

      // Re-throw other errors
      throw err;
    }
  }

  /**
   * Health check - verify the authority is reachable
   *
   * @returns {boolean} True if authority is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.token}`,
        },
        signal: AbortSignal.timeout(this.timeout),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Create an InventoryAuthorityClient from environment variables
 *
 * Expects:
 * - INVENTORY_AUTHORITY_URL: Base URL of the authority
 * - INVENTORY_AUTHORITY_TOKEN: Authentication token
 *
 * @throws {Error} If required environment variables are missing
 */
export function createInventoryAuthorityClient(): InventoryAuthorityClient {
  const baseUrl = process.env.INVENTORY_AUTHORITY_URL;
  const token = process.env.INVENTORY_AUTHORITY_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "Missing required environment variables: INVENTORY_AUTHORITY_URL and INVENTORY_AUTHORITY_TOKEN"
    );
  }

  return new InventoryAuthorityClient({
    baseUrl,
    token,
    timeout: parseInt(process.env.INVENTORY_AUTHORITY_TIMEOUT ?? "5000", 10),
  });
}
