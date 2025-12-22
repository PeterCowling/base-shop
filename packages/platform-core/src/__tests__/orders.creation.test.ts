/** @jest-environment node */

import { addOrder } from "../orders/creation";

jest.mock("../analytics", () => ({ trackOrder: jest.fn() }));
jest.mock("../db", () => ({
  prisma: {
    rentalOrder: { create: jest.fn(), update: jest.fn() },
    shop: { findUnique: jest.fn() },
  },
}));
jest.mock("../subscriptionUsage", () => ({
  incrementSubscriptionUsage: jest.fn(),
}));

const { trackOrder } = jest.requireMock("../analytics") as { trackOrder: jest.Mock };
const { prisma } = jest.requireMock("../db") as {
  prisma: {
    rentalOrder: { create: jest.Mock; update: jest.Mock };
    shop: { findUnique: jest.Mock };
  };
};
const { incrementSubscriptionUsage } = jest.requireMock("../subscriptionUsage") as {
  incrementSubscriptionUsage: jest.Mock;
};

describe("orders/creation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("persists order and tracks it", async () => {
    prisma.rentalOrder.create.mockResolvedValue({ id: "1" });
    prisma.shop.findUnique.mockResolvedValue({ data: { subscriptionsEnabled: true } });
    const order = await addOrder({
      shop: "shop",
      sessionId: "sess",
      deposit: 10,
      customerId: "cust",
    });
    expect(prisma.rentalOrder.create).toHaveBeenCalled();
    expect(trackOrder).toHaveBeenCalledWith("shop", order.id, 10);
    expect(incrementSubscriptionUsage).toHaveBeenCalled();
    expect(order).toMatchObject({ shop: "shop", sessionId: "sess", deposit: 10 });
  });

  it("treats unique constraint collisions as idempotent success", async () => {
    prisma.rentalOrder.create.mockRejectedValue({ code: "P2002" });
    prisma.rentalOrder.update.mockResolvedValue({
      id: "existing",
      shop: "shop",
      sessionId: "sess",
      deposit: 10,
      startedAt: "2025-01-01T00:00:00.000Z",
    });

    const order = await addOrder({ shop: "shop", sessionId: "sess", deposit: 10 });

    expect(prisma.rentalOrder.update).toHaveBeenCalled();
    expect(trackOrder).not.toHaveBeenCalled();
    expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
    expect(order).toMatchObject({ id: "existing", shop: "shop", sessionId: "sess" });
  });
});
