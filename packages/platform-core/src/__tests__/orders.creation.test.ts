/** @jest-environment node */

import { addOrder } from "../orders/creation";

jest.mock("../analytics", () => ({ trackOrder: jest.fn() }));
jest.mock("../db", () => ({
  prisma: {
    rentalOrder: { create: jest.fn() },
    shop: { findUnique: jest.fn() },
  },
}));
jest.mock("../subscriptionUsage", () => ({
  incrementSubscriptionUsage: jest.fn(),
}));

const { trackOrder } = jest.requireMock("../analytics") as { trackOrder: jest.Mock };
const { prisma } = jest.requireMock("../db") as {
  prisma: { rentalOrder: { create: jest.Mock }; shop: { findUnique: jest.Mock } };
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
    const order = await addOrder("shop", "sess", 10, undefined, undefined, "cust");
    expect(prisma.rentalOrder.create).toHaveBeenCalled();
    expect(trackOrder).toHaveBeenCalledWith("shop", order.id, 10);
    expect(incrementSubscriptionUsage).toHaveBeenCalled();
    expect(order).toMatchObject({ shop: "shop", sessionId: "sess", deposit: 10 });
  });
});

