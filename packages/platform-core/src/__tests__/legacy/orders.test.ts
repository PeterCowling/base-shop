/** @jest-environment node */

jest.mock("../../analytics", () => ({ trackOrder: jest.fn() }));
jest.mock("../../subscriptionUsage", () => ({ incrementSubscriptionUsage: jest.fn() }));

import { prisma } from "../../db";
import { addOrder, listOrders, getOrdersForCustomer } from "../../orders/creation";
import { markReturned, setReturnTracking, setReturnStatus } from "../../orders/status";
import { markRefunded } from "../../orders/refunds";
import { updateRisk } from "../../orders/risk";

const trackOrder: jest.Mock =
  jest.requireMock("../../analytics").trackOrder;
const incrementSubscriptionUsage: jest.Mock =
  jest.requireMock("../../subscriptionUsage").incrementSubscriptionUsage;

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

    const order = await addOrder({
      shop,
      sessionId,
      deposit: 5,
      customerId,
    });

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

    const order = await addOrder({
      shop,
      sessionId,
      deposit: 5,
      returnDueDate,
      riskLevel,
      riskScore,
      flaggedForReview,
    });

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
});
