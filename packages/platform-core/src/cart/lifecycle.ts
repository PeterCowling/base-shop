// packages/platform-core/src/cart/lifecycle.ts

/**
 * Cart lifecycle state machine for idempotent cart clearing and audit trail.
 *
 * This module tracks the relationship between carts, checkout sessions, and orders
 * to enable:
 * - Idempotent cart clearing (safe webhook retries)
 * - Audit trail for debugging and compliance
 * - Prevention of double-clearing on duplicate webhook events
 */

import { deleteCart } from "../cartStore";
import { prisma } from "../db";

/**
 * Cart lifecycle states
 */
export enum CartStatus {
  /** Shopping in progress */
  ACTIVE = "active",
  /** Checkout session started */
  CHECKOUT_INITIATED = "checkout_initiated",
  /** Payment processing */
  ORDER_PENDING = "order_pending",
  /** Order finalized, cart cleared */
  ORDER_COMPLETE = "order_complete",
  /** Payment failed, cart preserved */
  ORDER_FAILED = "order_failed",
}

/**
 * Cart lifecycle record
 */
export interface CartLifecycle {
  id: string;
  cartId: string;
  shopId: string;
  status: CartStatus;
  checkoutSessionId?: string;
  orderId?: string;
  clearedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Error thrown when cart clearing fails due to state mismatch
 */
export class CartLifecycleError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "SESSION_MISMATCH"
      | "ALREADY_FAILED"
      | "INVALID_STATE",
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "CartLifecycleError";
  }
}

/**
 * Mark a cart as having initiated checkout.
 *
 * Call this when creating a Stripe checkout session to track the session-cart
 * relationship for later idempotent clearing.
 */
export async function initiateCheckout(
  shopId: string,
  cartId: string,
  checkoutSessionId: string
): Promise<CartLifecycle> {
  const result = await prisma.cartLifecycle.upsert({
    where: { shopId_cartId: { shopId, cartId } },
    update: {
      status: CartStatus.CHECKOUT_INITIATED,
      checkoutSessionId,
    },
    create: {
      shopId,
      cartId,
      status: CartStatus.CHECKOUT_INITIATED,
      checkoutSessionId,
    },
  });

  return {
    ...result,
    status: result.status as CartStatus,
  };
}

/**
 * Mark checkout as pending payment.
 *
 * Call this when payment is being processed but not yet confirmed.
 */
export async function markOrderPending(
  shopId: string,
  cartId: string,
  checkoutSessionId: string
): Promise<CartLifecycle> {
  const lifecycle = await prisma.cartLifecycle.findUnique({
    where: { shopId_cartId: { shopId, cartId } },
  });

  if (lifecycle && lifecycle.checkoutSessionId !== checkoutSessionId) {
    throw new CartLifecycleError(
      `Session mismatch: expected ${lifecycle.checkoutSessionId}, got ${checkoutSessionId}`,
      "SESSION_MISMATCH",
      {
        expected: lifecycle.checkoutSessionId,
        received: checkoutSessionId,
      }
    );
  }

  const result = await prisma.cartLifecycle.upsert({
    where: { shopId_cartId: { shopId, cartId } },
    update: {
      status: CartStatus.ORDER_PENDING,
      checkoutSessionId,
    },
    create: {
      shopId,
      cartId,
      status: CartStatus.ORDER_PENDING,
      checkoutSessionId,
    },
  });

  return {
    ...result,
    status: result.status as CartStatus,
  };
}

/**
 * Clear cart for a completed order (idempotent).
 *
 * This function is safe to call multiple times for the same order - it will
 * only clear the cart once and return success on subsequent calls.
 *
 * @param shopId - Shop identifier
 * @param cartId - Cart identifier
 * @param orderId - Internal order identifier
 * @param sessionId - Stripe checkout session ID
 * @returns void
 * @throws CartLifecycleError if session doesn't match or cart already failed
 */
export async function clearCartForOrder(
  shopId: string,
  cartId: string,
  orderId: string,
  sessionId: string
): Promise<void> {
  // 1. Check current lifecycle state
  const lifecycle = await prisma.cartLifecycle.findUnique({
    where: { shopId_cartId: { shopId, cartId } },
  });

  // 2. IDEMPOTENT: If already cleared for this order, return success
  if (
    lifecycle?.status === CartStatus.ORDER_COMPLETE &&
    lifecycle.orderId === orderId
  ) {
    console.info("[cart-lifecycle] Cart already cleared for order", {
      cartId,
      orderId,
    });
    return;
  }

  // 3. Verify session matches (if lifecycle exists)
  if (lifecycle && lifecycle.checkoutSessionId !== sessionId) {
    throw new CartLifecycleError(
      `Session mismatch: expected ${lifecycle.checkoutSessionId}, got ${sessionId}`,
      "SESSION_MISMATCH",
      {
        cartId,
        expected: lifecycle.checkoutSessionId,
        received: sessionId,
      }
    );
  }

  // 4. Don't clear if already marked as failed
  if (lifecycle?.status === CartStatus.ORDER_FAILED) {
    throw new CartLifecycleError(
      "Cannot clear cart that already failed checkout",
      "ALREADY_FAILED",
      { cartId, orderId }
    );
  }

  // 5. Clear cart from storage
  await deleteCart(cartId);

  // 6. Update lifecycle to complete
  await prisma.cartLifecycle.upsert({
    where: { shopId_cartId: { shopId, cartId } },
    update: {
      status: CartStatus.ORDER_COMPLETE,
      orderId,
      clearedAt: new Date(),
    },
    create: {
      shopId,
      cartId,
      status: CartStatus.ORDER_COMPLETE,
      checkoutSessionId: sessionId,
      orderId,
      clearedAt: new Date(),
    },
  });

  console.info("[cart-lifecycle] Cart cleared for order", {
    cartId,
    orderId,
    sessionId,
  });
}

/**
 * Mark a cart checkout as failed.
 *
 * Call this when payment fails to preserve the cart for retry.
 */
export async function markOrderFailed(
  shopId: string,
  cartId: string,
  checkoutSessionId: string
): Promise<CartLifecycle> {
  const result = await prisma.cartLifecycle.upsert({
    where: { shopId_cartId: { shopId, cartId } },
    update: {
      status: CartStatus.ORDER_FAILED,
    },
    create: {
      shopId,
      cartId,
      status: CartStatus.ORDER_FAILED,
      checkoutSessionId,
    },
  });

  console.info("[cart-lifecycle] Cart marked as failed", {
    cartId,
    sessionId: checkoutSessionId,
  });

  return {
    ...result,
    status: result.status as CartStatus,
  };
}

/**
 * Get the current lifecycle state for a cart.
 */
export async function getCartLifecycle(
  shopId: string,
  cartId: string
): Promise<CartLifecycle | null> {
  const result = await prisma.cartLifecycle.findUnique({
    where: { shopId_cartId: { shopId, cartId } },
  });

  if (!result) return null;

  return {
    ...result,
    status: result.status as CartStatus,
  };
}
