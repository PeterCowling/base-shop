/** @jest-environment node */

jest.mock("./analytics", () => ({ trackOrder: jest.fn() }));
jest.mock("./subscriptionUsage", () => ({ incrementSubscriptionUsage: jest.fn() }));

import { prisma } from "./db";
import {
  addOrder,
  markReturned,
  markRefunded,
  updateRisk,
  listOrders,
  getOrdersForCustomer,
  setReturnTracking,
  setReturnStatus,
} from "./orders";

const { trackOrder } = jest.requireMock("./analytics") as { trackOrder: jest.Mock };
const { incrementSubscriptionUsage } = jest.requireMock("./subscriptionUsage") as {
  incrementSubscriptionUsage: jest.Mock;
};

describe("orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds order, tracks and increments subscription usage", async () => {
    const shop = "shop-add";
    const sessionId = "sess1";
    const customerId = "cust1";
    const findUniqueSpy = jest
      .spyOn(prisma.shop, "findUnique")
      .mockResolvedValue({ data: { subscriptionsEnabled: true } });

    const order = await addOrder(shop, sessionId, 5, undefined, undefined, customerId);

    expect(order).toMatchObject({ shop, sessionId, deposit: 5 });
    expect(trackOrder).toHaveBeenCalledWith(shop, order.id, 5);
    expect(incrementSubscriptionUsage).toHaveBeenCalled();
    const stored = await prisma.rentalOrder.findMany({ where: { shop } });
    expect(stored).toHaveLength(1);
    findUniqueSpy.mockRestore();
  });

  it("adds order with due date and risk details", async () => {
    const shop = "shop-add-risk";
    const sessionId = "sess-risk";
    const returnDueDate = "2030-02-03";
    const riskLevel = "medium";
    const riskScore = 4;
    const flaggedForReview = true;

    const order = await addOrder(
      shop,
      sessionId,
      5,
      undefined,
      returnDueDate,
      undefined,
      riskLevel,
      riskScore,
      flaggedForReview,
    );

    expect(order).toMatchObject({
      shop,
      sessionId,
      returnDueDate,
      riskLevel,
      riskScore,
      flaggedForReview,
    });

    const stored = await prisma.rentalOrder.findMany({ where: { shop } });
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      returnDueDate,
      riskLevel,
      riskScore,
      flaggedForReview,
    });
  });

  it("marks order returned", async () => {
    const shop = "shop-return";
    await prisma.rentalOrder.create({ data: { shop, sessionId: "s1" } });
    const result = await markReturned(shop, "s1", 4);
    expect(result).toMatchObject({ shop, sessionId: "s1", damageFee: 4 });
    expect(result?.returnedAt).toBeDefined();
  });

  it("marks order refunded with risk info", async () => {
    const shop = "shop-refund";
    await prisma.rentalOrder.create({ data: { shop, sessionId: "s1" } });
    const result = await markRefunded(shop, "s1", "high", 7, true);
    expect(result).toMatchObject({
      shop,
      sessionId: "s1",
      riskLevel: "high",
      riskScore: 7,
      flaggedForReview: true,
    });
    expect(result?.refundedAt).toBeDefined();
  });

  it("updates risk fields", async () => {
    const shop = "shop-risk";
    await prisma.rentalOrder.create({ data: { shop, sessionId: "s1" } });
    const result = await updateRisk(shop, "s1", "low", 1, false);
    expect(result).toMatchObject({ riskLevel: "low", riskScore: 1, flaggedForReview: false });
  });

  it("sets return tracking info", async () => {
    const shop = "shop-track";
    await prisma.rentalOrder.create({ data: { shop, sessionId: "s1" } });
    const result = await setReturnTracking(shop, "s1", "tn1", "url1");
    expect(result).toMatchObject({ trackingNumber: "tn1", labelUrl: "url1" });
  });

  it("sets return status by tracking number", async () => {
    const shop = "shop-status";
    await prisma.rentalOrder.create({ data: { shop, sessionId: "s1", trackingNumber: "tn1" } });
    const result = await setReturnStatus(shop, "tn1", "received");
    expect(result).toMatchObject({ returnStatus: "received" });
  });

  it("listOrders normalizes null values", async () => {
    const shop = "shop-list";
    await prisma.rentalOrder.create({ data: { shop, sessionId: "s1", foo: null } });
    const orders = await listOrders(shop);
    expect(orders).toHaveLength(1);
    expect((orders[0] as any).foo).toBeUndefined();
  });

  it("getOrdersForCustomer normalizes null values", async () => {
    const shop = "shop-query";
    const customerId = "cust1";
    await prisma.rentalOrder.create({
      data: { shop, sessionId: "s1", customerId, foo: null },
    });
    const orders = await getOrdersForCustomer(shop, customerId);
    expect(orders).toHaveLength(1);
    expect((orders[0] as any).foo).toBeUndefined();
  });

  it("does not increment subscription usage when disabled", async () => {
    const shop = "shop-no-sub";
    const sessionId = "sess2";
    const customerId = "cust2";
    const findUniqueSpy = jest
      .spyOn(prisma.shop, "findUnique")
      .mockResolvedValue({ data: { subscriptionsEnabled: false } });

    const order = await addOrder(shop, sessionId, 5, undefined, undefined, customerId);

    expect(order).toMatchObject({ shop, sessionId, deposit: 5 });
    expect(trackOrder).toHaveBeenCalledWith(shop, order.id, 5);
    expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
    findUniqueSpy.mockRestore();
  });

  it("markReturned updates with damage fee and returns null when missing", async () => {
    const shop = "shop-update-return";
    const sessionId = "sess-return";
    const updateSpy = jest
      .spyOn(prisma.rentalOrder, "update")
      .mockResolvedValueOnce({} as any);

    await markReturned(shop, sessionId, 3);
    expect(updateSpy).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop, sessionId } },
      data: { returnedAt: expect.any(String), damageFee: 3 },
    });

    updateSpy.mockRejectedValueOnce(new Error("missing"));
    const missing = await markReturned(shop, sessionId, 3);
    expect(missing).toBeNull();
    updateSpy.mockRestore();
  });

  it("markRefunded updates risk data and returns null when missing", async () => {
    const shop = "shop-update-refund";
    const sessionId = "sess-refund";
    const updateSpy = jest
      .spyOn(prisma.rentalOrder, "update")
      .mockResolvedValueOnce({} as any);

    await markRefunded(shop, sessionId, "high", 7, true);
    expect(updateSpy).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop, sessionId } },
      data: {
        refundedAt: expect.any(String),
        riskLevel: "high",
        riskScore: 7,
        flaggedForReview: true,
      },
    });

    updateSpy.mockRejectedValueOnce(new Error("missing"));
    const missing = await markRefunded(shop, sessionId);
    expect(missing).toBeNull();
    updateSpy.mockRestore();
  });

  it("setReturnTracking updates fields and returns null when missing", async () => {
    const shop = "shop-update-track";
    const sessionId = "sess-track";
    const updateSpy = jest
      .spyOn(prisma.rentalOrder, "update")
      .mockResolvedValueOnce({} as any);

    await setReturnTracking(shop, sessionId, "tn2", "url2");
    expect(updateSpy).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop, sessionId } },
      data: { trackingNumber: "tn2", labelUrl: "url2" },
    });

    updateSpy.mockRejectedValueOnce(new Error("missing"));
    const missing = await setReturnTracking(shop, sessionId, "tn2", "url2");
    expect(missing).toBeNull();
    updateSpy.mockRestore();
  });

  it("updateRisk sends correct payload and returns null when missing", async () => {
    const shop = "shop-update-risk";
    const sessionId = "sess-risk";
    const updateSpy = jest
      .spyOn(prisma.rentalOrder, "update")
      .mockResolvedValueOnce({} as any);

    await updateRisk(shop, sessionId, "low", 1, false);
    expect(updateSpy).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop, sessionId } },
      data: { riskLevel: "low", riskScore: 1, flaggedForReview: false },
    });

    updateSpy.mockRejectedValueOnce(new Error("missing"));
    const missing = await updateRisk(shop, sessionId, "low", 1, false);
    expect(missing).toBeNull();
    updateSpy.mockRestore();
  });
});

