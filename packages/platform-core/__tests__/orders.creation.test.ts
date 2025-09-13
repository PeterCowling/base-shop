/** @jest-environment node */

import { addOrder } from "../src/orders";

jest.mock("../src/db", () => ({
  prisma: {
    rentalOrder: { create: jest.fn() },
    shop: { findUnique: jest.fn() },
  },
}));

jest.mock("../src/analytics", () => ({ trackOrder: jest.fn() }));

jest.mock("../src/subscriptionUsage", () => ({
  incrementSubscriptionUsage: jest.fn(),
}));

jest.mock("ulid", () => ({ ulid: () => "ID" }));

jest.mock("@acme/date-utils", () => ({
  nowIso: () => "2024-01-02T00:00:00.000Z",
}));

const { prisma } = jest.requireMock("../src/db") as {
  prisma: {
    rentalOrder: { create: jest.Mock };
    shop: { findUnique: jest.Mock };
  };
};
const { trackOrder } = jest.requireMock("../src/analytics") as {
  trackOrder: jest.Mock;
};
const { incrementSubscriptionUsage } = jest.requireMock(
  "../src/subscriptionUsage",
) as { incrementSubscriptionUsage: jest.Mock };

describe("addOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds order with optional fields set", async () => {
    prisma.rentalOrder.create.mockResolvedValue({});
    prisma.shop.findUnique.mockResolvedValue({
      data: { subscriptionsEnabled: true },
    });

    const order = await addOrder(
      "shop",
      "sess",
      10,
      "exp",
      "due",
      "cust",
      "high",
      1,
      true,
    );

    expect(prisma.rentalOrder.create).toHaveBeenCalledWith({
      data: order,
    });
    expect(order).toMatchObject({
      id: "ID",
      sessionId: "sess",
      shop: "shop",
      deposit: 10,
      startedAt: "2024-01-02T00:00:00.000Z",
      expectedReturnDate: "exp",
      returnDueDate: "due",
      customerId: "cust",
      riskLevel: "high",
      riskScore: 1,
      flaggedForReview: true,
    });
    expect(trackOrder).toHaveBeenCalledWith("shop", "ID", 10);
    expect(incrementSubscriptionUsage).toHaveBeenCalledWith(
      "shop",
      "cust",
      "2024-01",
    );
  });

  it("adds order without optional fields", async () => {
    prisma.rentalOrder.create.mockResolvedValue({});

    const order = await addOrder("shop", "sess", 10);

    expect(prisma.rentalOrder.create).toHaveBeenCalledWith({
      data: order,
    });
    expect(order).toMatchObject({
      id: "ID",
      sessionId: "sess",
      shop: "shop",
      deposit: 10,
      startedAt: "2024-01-02T00:00:00.000Z",
    });
    expect(order).not.toHaveProperty("expectedReturnDate");
    expect(order).not.toHaveProperty("returnDueDate");
    expect(order).not.toHaveProperty("customerId");
    expect(order).not.toHaveProperty("riskLevel");
    expect(order).not.toHaveProperty("riskScore");
    expect(order).not.toHaveProperty("flaggedForReview");
    expect(trackOrder).toHaveBeenCalledWith("shop", "ID", 10);
    expect(prisma.shop.findUnique).not.toHaveBeenCalled();
    expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
  });

  it("increments subscription usage only when enabled", async () => {
    prisma.rentalOrder.create.mockResolvedValue({});
    prisma.shop.findUnique.mockResolvedValue({
      data: { subscriptionsEnabled: false },
    });

    await addOrder("shop", "sess", 10, undefined, undefined, "cust");

    expect(prisma.shop.findUnique).toHaveBeenCalledWith({
      select: { data: true },
      where: { id: "shop" },
    });
    expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
  });
});

