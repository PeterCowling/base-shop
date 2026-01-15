/**
 * Cart Lifecycle State Machine Tests
 *
 * Tests for idempotent cart clearing and lifecycle tracking.
 */

// Set up mocks before imports
jest.mock("../src/cartStore", () => ({
  deleteCart: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../src/db", () => ({
  prisma: {
    cartLifecycle: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import {
  CartStatus,
  CartLifecycleError,
  clearCartForOrder,
  initiateCheckout,
  markOrderPending,
  markOrderFailed,
  getCartLifecycle,
} from "../src/cart/lifecycle";

const { prisma: prismaMock } = jest.requireMock("../src/db") as {
  prisma: {
    cartLifecycle: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };
};

const { deleteCart: deleteCartMock } = jest.requireMock("../src/cartStore") as {
  deleteCart: jest.Mock;
};

describe("Cart Lifecycle State Machine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initiateCheckout", () => {
    it("should create lifecycle record when starting checkout", async () => {
      const shopId = "shop-123";
      const cartId = "cart-456";
      const sessionId = "cs_test_session";

      prismaMock.cartLifecycle.upsert.mockResolvedValue({
        id: "lifecycle-1",
        shopId,
        cartId,
        status: CartStatus.CHECKOUT_INITIATED,
        checkoutSessionId: sessionId,
        orderId: null,
        clearedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await initiateCheckout(shopId, cartId, sessionId);

      expect(result.status).toBe(CartStatus.CHECKOUT_INITIATED);
      expect(result.checkoutSessionId).toBe(sessionId);
      expect(prismaMock.cartLifecycle.upsert).toHaveBeenCalledWith({
        where: { shopId_cartId: { shopId, cartId } },
        update: {
          status: CartStatus.CHECKOUT_INITIATED,
          checkoutSessionId: sessionId,
        },
        create: {
          shopId,
          cartId,
          status: CartStatus.CHECKOUT_INITIATED,
          checkoutSessionId: sessionId,
        },
      });
    });
  });

  describe("markOrderPending", () => {
    it("should update status to ORDER_PENDING", async () => {
      const shopId = "shop-123";
      const cartId = "cart-456";
      const sessionId = "cs_test_session";

      prismaMock.cartLifecycle.findUnique.mockResolvedValue({
        id: "lifecycle-1",
        shopId,
        cartId,
        status: CartStatus.CHECKOUT_INITIATED,
        checkoutSessionId: sessionId,
        orderId: null,
        clearedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaMock.cartLifecycle.upsert.mockResolvedValue({
        id: "lifecycle-1",
        shopId,
        cartId,
        status: CartStatus.ORDER_PENDING,
        checkoutSessionId: sessionId,
        orderId: null,
        clearedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await markOrderPending(shopId, cartId, sessionId);

      expect(result.status).toBe(CartStatus.ORDER_PENDING);
    });

    it("should throw on session mismatch", async () => {
      const shopId = "shop-123";
      const cartId = "cart-456";

      prismaMock.cartLifecycle.findUnique.mockResolvedValue({
        id: "lifecycle-1",
        shopId,
        cartId,
        status: CartStatus.CHECKOUT_INITIATED,
        checkoutSessionId: "original_session",
        orderId: null,
        clearedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        markOrderPending(shopId, cartId, "different_session")
      ).rejects.toThrow(CartLifecycleError);
    });
  });

  describe("clearCartForOrder (idempotent)", () => {
    it("should clear cart on first call", async () => {
      const shopId = "shop-123";
      const cartId = "cart-456";
      const orderId = "order-789";
      const sessionId = "cs_test_session";

      // No existing lifecycle
      prismaMock.cartLifecycle.findUnique.mockResolvedValue(null);
      prismaMock.cartLifecycle.upsert.mockResolvedValue({
        id: "lifecycle-1",
        shopId,
        cartId,
        status: CartStatus.ORDER_COMPLETE,
        checkoutSessionId: sessionId,
        orderId,
        clearedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await clearCartForOrder(shopId, cartId, orderId, sessionId);

      expect(deleteCartMock).toHaveBeenCalledWith(cartId);
      expect(prismaMock.cartLifecycle.upsert).toHaveBeenCalled();
    });

    it("should be idempotent - no-op on duplicate calls with same orderId", async () => {
      const shopId = "shop-123";
      const cartId = "cart-456";
      const orderId = "order-789";
      const sessionId = "cs_test_session";

      // Already cleared
      prismaMock.cartLifecycle.findUnique.mockResolvedValue({
        id: "lifecycle-1",
        shopId,
        cartId,
        status: CartStatus.ORDER_COMPLETE,
        checkoutSessionId: sessionId,
        orderId, // Same order ID
        clearedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await clearCartForOrder(shopId, cartId, orderId, sessionId);

      // Should not call deleteCart or upsert again
      expect(deleteCartMock).not.toHaveBeenCalled();
      expect(prismaMock.cartLifecycle.upsert).not.toHaveBeenCalled();
    });

    it("should throw on session mismatch", async () => {
      const shopId = "shop-123";
      const cartId = "cart-456";
      const orderId = "order-789";

      prismaMock.cartLifecycle.findUnique.mockResolvedValue({
        id: "lifecycle-1",
        shopId,
        cartId,
        status: CartStatus.CHECKOUT_INITIATED,
        checkoutSessionId: "original_session",
        orderId: null,
        clearedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        clearCartForOrder(shopId, cartId, orderId, "different_session")
      ).rejects.toThrow(CartLifecycleError);
    });

    it("should throw when trying to clear already-failed cart", async () => {
      const shopId = "shop-123";
      const cartId = "cart-456";
      const orderId = "order-789";
      const sessionId = "cs_test_session";

      prismaMock.cartLifecycle.findUnique.mockResolvedValue({
        id: "lifecycle-1",
        shopId,
        cartId,
        status: CartStatus.ORDER_FAILED,
        checkoutSessionId: sessionId,
        orderId: null,
        clearedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        clearCartForOrder(shopId, cartId, orderId, sessionId)
      ).rejects.toThrow(CartLifecycleError);
    });
  });

  describe("markOrderFailed", () => {
    it("should mark cart as failed", async () => {
      const shopId = "shop-123";
      const cartId = "cart-456";
      const sessionId = "cs_test_session";

      prismaMock.cartLifecycle.upsert.mockResolvedValue({
        id: "lifecycle-1",
        shopId,
        cartId,
        status: CartStatus.ORDER_FAILED,
        checkoutSessionId: sessionId,
        orderId: null,
        clearedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await markOrderFailed(shopId, cartId, sessionId);

      expect(result.status).toBe(CartStatus.ORDER_FAILED);
    });
  });

  describe("getCartLifecycle", () => {
    it("should return lifecycle state", async () => {
      const shopId = "shop-123";
      const cartId = "cart-456";

      prismaMock.cartLifecycle.findUnique.mockResolvedValue({
        id: "lifecycle-1",
        shopId,
        cartId,
        status: CartStatus.ACTIVE,
        checkoutSessionId: null,
        orderId: null,
        clearedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await getCartLifecycle(shopId, cartId);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(CartStatus.ACTIVE);
    });

    it("should return null for non-existent lifecycle", async () => {
      prismaMock.cartLifecycle.findUnique.mockResolvedValue(null);

      const result = await getCartLifecycle("shop-123", "cart-456");

      expect(result).toBeNull();
    });
  });
});
