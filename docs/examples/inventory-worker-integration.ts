/**
 * Example: Inventory Integration for Cloudflare Workers
 *
 * This example shows how to integrate the inventory validation system
 * into a Cloudflare Worker-based shop checkout flow.
 *
 * Key Principles:
 * 1. Fail-closed: If inventory authority unavailable, reject checkout
 * 2. Validate before creating checkout session
 * 3. Handle errors gracefully with proper status codes
 * 4. Log for observability
 */

import { InventoryAuthorityClient } from "@acme/platform-core/inventory/client";

// Environment variables (set in wrangler.toml)
interface Env {
  INVENTORY_AUTHORITY_URL: string;
  INVENTORY_AUTHORITY_TOKEN: string;
  INVENTORY_AUTHORITY_TIMEOUT?: string;
  SHOP_ID: string;
}

// Cart item structure
interface CartItem {
  sku: string;
  variantKey: string;
  quantity: number;
  title: string;
  price: number;
}

interface Cart {
  items: CartItem[];
}

/**
 * Example 1: Basic Checkout Flow with Inventory Validation
 */
export async function handleCheckout(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // 1. Parse cart from request
    const body = await request.json();
    const cart: Cart = body.cart;

    if (!cart || !cart.items || cart.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "cart_empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Create inventory client
    const inventoryClient = new InventoryAuthorityClient({
      baseUrl: env.INVENTORY_AUTHORITY_URL,
      token: env.INVENTORY_AUTHORITY_TOKEN,
      timeout: parseInt(env.INVENTORY_AUTHORITY_TIMEOUT ?? "5000"),
    });

    // 3. Validate inventory availability
    const inventoryRequests = cart.items.map((item) => ({
      sku: item.sku,
      variantKey: item.variantKey,
      quantity: item.quantity,
    }));

    let validationResult;
    try {
      validationResult = await inventoryClient.validate(
        env.SHOP_ID,
        inventoryRequests
      );
    } catch (err) {
      // Fail closed - don't allow checkout if authority unavailable
      console.error("[Checkout] Inventory validation failed:", err);

      if (err instanceof Error) {
        if (err.message.includes("timeout")) {
          return new Response(
            JSON.stringify({
              error: "inventory_timeout",
              message: "Inventory check timed out. Please try again.",
            }),
            { status: 504, headers: { "Content-Type": "application/json" } }
          );
        }

        if (err.message.includes("unavailable")) {
          return new Response(
            JSON.stringify({
              error: "inventory_unavailable",
              message: "Inventory system unavailable. Please try again shortly.",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // Generic error - still fail closed
      return new Response(
        JSON.stringify({
          error: "internal_error",
          message: "Unable to verify inventory. Please try again.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Handle insufficient inventory
    if (!validationResult.ok) {
      console.log("[Checkout] Insufficient inventory:", validationResult.insufficient);

      return new Response(
        JSON.stringify({
          error: "insufficient_stock",
          message: "Some items are out of stock",
          items: validationResult.insufficient,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Proceed with checkout (create Stripe session, etc.)
    // At this point, inventory is validated. The Node.js backend will create
    // the actual hold when processing the checkout session.

    const checkoutUrl = await createStripeCheckoutSession(cart, env);

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[Checkout] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Example 2: Health Check with Fallback
 */
export async function checkInventoryHealth(env: Env): Promise<boolean> {
  try {
    const client = new InventoryAuthorityClient({
      baseUrl: env.INVENTORY_AUTHORITY_URL,
      token: env.INVENTORY_AUTHORITY_TOKEN,
      timeout: 3000, // Short timeout for health check
    });

    return await client.healthCheck();
  } catch (err) {
    console.error("[Health] Inventory authority unreachable:", err);
    return false;
  }
}

/**
 * Example 3: Graceful Degradation (Optional)
 *
 * IMPORTANT: This is NOT recommended for production. It allows checkout
 * to proceed even if inventory validation fails. Use only for testing
 * or emergency bypass scenarios.
 */
export async function handleCheckoutWithFallback(
  request: Request,
  env: Env,
  allowFallback: boolean = false
): Promise<Response> {
  const body = await request.json();
  const cart: Cart = body.cart;

  const inventoryClient = new InventoryAuthorityClient({
    baseUrl: env.INVENTORY_AUTHORITY_URL,
    token: env.INVENTORY_AUTHORITY_TOKEN,
  });

  try {
    const inventoryRequests = cart.items.map((item) => ({
      sku: item.sku,
      variantKey: item.variantKey,
      quantity: item.quantity,
    }));

    const validationResult = await inventoryClient.validate(
      env.SHOP_ID,
      inventoryRequests
    );

    if (!validationResult.ok) {
      return new Response(
        JSON.stringify({
          error: "insufficient_stock",
          items: validationResult.insufficient,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    if (allowFallback) {
      // WARNING: Allows checkout without inventory validation
      console.warn("[Checkout] Inventory validation failed, proceeding anyway:", err);
    } else {
      // Fail closed (recommended)
      throw err;
    }
  }

  const checkoutUrl = await createStripeCheckoutSession(cart, env);

  return new Response(
    JSON.stringify({ success: true, checkoutUrl }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * Example 4: Complete Worker with Routing
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle checkout
    if (url.pathname === "/api/checkout" && request.method === "POST") {
      return handleCheckout(request, env);
    }

    // Handle health check
    if (url.pathname === "/api/health/inventory" && request.method === "GET") {
      const healthy = await checkInventoryHealth(env);
      return new Response(
        JSON.stringify({ healthy }),
        {
          status: healthy ? 200 : 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};

/**
 * Helper: Create Stripe checkout session (placeholder)
 */
async function createStripeCheckoutSession(
  cart: Cart,
  env: Env
): Promise<string> {
  // In real implementation:
  // 1. Call Stripe API to create checkout session
  // 2. Pass cart data
  // 3. Return checkout URL
  return "https://checkout.stripe.com/...";
}

/**
 * Example 5: Cart Item Validation
 *
 * Validate individual cart items before attempting checkout
 */
export async function validateCartItem(
  sku: string,
  variantKey: string,
  quantity: number,
  env: Env
): Promise<{ available: boolean; maxQuantity?: number }> {
  const client = new InventoryAuthorityClient({
    baseUrl: env.INVENTORY_AUTHORITY_URL,
    token: env.INVENTORY_AUTHORITY_TOKEN,
  });

  try {
    const result = await client.validate(env.SHOP_ID, [
      { sku, variantKey, quantity },
    ]);

    if (result.ok) {
      return { available: true };
    }

    // Return available quantity
    const insufficient = result.insufficient?.[0];
    return {
      available: false,
      maxQuantity: insufficient?.available ?? 0,
    };
  } catch (err) {
    console.error("[Cart] Validation failed:", err);
    // Fail closed - assume unavailable
    return { available: false, maxQuantity: 0 };
  }
}

/**
 * Configuration Example (wrangler.toml)
 *
 * Add to your wrangler.toml:
 *
 * [vars]
 * INVENTORY_AUTHORITY_URL = "https://your-cms.example.com/api/inventory"
 * INVENTORY_AUTHORITY_TOKEN = "your-secure-token"
 * INVENTORY_AUTHORITY_TIMEOUT = "5000"
 * SHOP_ID = "your-shop-id"
 */

/**
 * Error Handling Best Practices:
 *
 * 1. Always fail closed (reject checkout if validation fails)
 * 2. Log errors for debugging
 * 3. Return user-friendly error messages
 * 4. Use appropriate HTTP status codes:
 *    - 409 Conflict: Insufficient stock
 *    - 503 Service Unavailable: Authority down
 *    - 504 Gateway Timeout: Authority timeout
 *    - 500 Internal Error: Unexpected errors
 * 5. Implement retry logic for transient failures (optional)
 */

/**
 * Testing:
 *
 * 1. Unit tests: Mock InventoryAuthorityClient
 * 2. Integration tests: Test against real authority
 * 3. Load tests: Verify performance under load
 * 4. Failure scenarios: Test timeouts, unavailability, etc.
 */
