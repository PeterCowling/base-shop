/** @jest-environment node */

import * as orders from "../../src/orders";

import { createOrder } from "./orderFactory";
import {
  incrementSubscriptionUsage,
  nowIsoMock,
  prismaMock,
  trackOrder,
  ulidMock,
} from "./setup";

const { listOrders, addOrder, getOrdersForCustomer, readOrders } = orders;

describe("order creation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listOrders", () => {
    it("normalizes null fields", async () => {
      prismaMock.rentalOrder.findMany.mockResolvedValue([
        createOrder({ shop: "shop", foo: null }),
      ]);
      const result = await listOrders("shop");
      expect(prismaMock.rentalOrder.findMany).toHaveBeenCalledWith({
        where: { shop: "shop" },
      });
      expect(result[0].foo).toBeUndefined();
    });

    it("propagates errors without normalization", async () => {
      prismaMock.rentalOrder.findMany.mockRejectedValue(new Error("fail"));
      await expect(listOrders("shop")).rejects.toThrow("fail");
      expect(prismaMock.rentalOrder.findMany).toHaveBeenCalledWith({
        where: { shop: "shop" },
      });
    });
  });

  describe("readOrders alias", () => {
    it("normalizes null fields", async () => {
      prismaMock.rentalOrder.findMany.mockResolvedValue([
        createOrder({ shop: "shop", foo: null }),
      ]);
      const result = await readOrders("shop");
      expect(prismaMock.rentalOrder.findMany).toHaveBeenCalledWith({
        where: { shop: "shop" },
      });
      expect(result[0].foo).toBeUndefined();
    });
  });

  describe("addOrder", () => {
    it("generates ids, timestamps and tracks order", async () => {
      ulidMock.mockReturnValue("ID");
      nowIsoMock.mockReturnValue("2024-01-02T00:00:00.000Z");
	      prismaMock.rentalOrder.create.mockResolvedValue({});
	      prismaMock.shop.findUnique.mockResolvedValue({
	        data: { subscriptionsEnabled: true },
	      });
	      const order = await addOrder({
	        shop: "shop",
	        sessionId: "sess",
	        deposit: 10,
	        expectedReturnDate: "exp",
	        returnDueDate: "due",
	        customerId: "cust",
	        riskLevel: "high",
	        riskScore: 1,
	        flaggedForReview: true,
	      });
      expect(ulidMock).toHaveBeenCalled();
      expect(nowIsoMock).toHaveBeenCalledTimes(2);
      expect(prismaMock.rentalOrder.create).toHaveBeenCalledWith({
        data: order,
      });
      expect(trackOrder).toHaveBeenCalledWith("shop", "ID", 10);
      expect(incrementSubscriptionUsage).toHaveBeenCalledWith(
        "shop",
        "cust",
        "2024-01"
      );
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
    });

    it("handles individual optional fields and falsy values", async () => {
      ulidMock.mockReturnValue("ID");
	      nowIsoMock.mockReturnValue("now");
	      prismaMock.rentalOrder.create.mockResolvedValue({});
	      const order = await addOrder({
	        shop: "shop",
	        sessionId: "sess",
	        deposit: 10,
	        expectedReturnDate: "exp",
	        riskLevel: "low",
	        riskScore: 0,
	        flaggedForReview: false,
	      });
      expect(prismaMock.rentalOrder.create).toHaveBeenCalledWith({
        data: order,
      });
      expect(order).toEqual({
        id: "ID",
        sessionId: "sess",
        shop: "shop",
        deposit: 10,
        startedAt: "now",
        expectedReturnDate: "exp",
        riskLevel: "low",
        riskScore: 0,
        flaggedForReview: false,
      });
      expect(trackOrder).toHaveBeenCalledWith("shop", "ID", 10);
      expect(prismaMock.shop.findUnique).not.toHaveBeenCalled();
      expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
    });

    it("omits optional fields when not provided and skips subscription usage", async () => {
	      ulidMock.mockReturnValue("ID");
	      nowIsoMock.mockReturnValue("now");
	      prismaMock.rentalOrder.create.mockResolvedValue({});
	      const order = await addOrder({ shop: "shop", sessionId: "sess", deposit: 10 });
      expect(prismaMock.rentalOrder.create).toHaveBeenCalledWith({
        data: order,
      });
      expect(order).toEqual({
        id: "ID",
        sessionId: "sess",
        shop: "shop",
        deposit: 10,
        startedAt: "now",
      });
      expect(trackOrder).toHaveBeenCalledWith("shop", "ID", 10);
      expect(prismaMock.shop.findUnique).not.toHaveBeenCalled();
      expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
    });

    it("skips subscription usage when disabled", async () => {
      ulidMock.mockReturnValue("ID");
      nowIsoMock.mockReturnValue("now");
      prismaMock.rentalOrder.create.mockResolvedValue({});
	      prismaMock.shop.findUnique.mockResolvedValue({
	        data: { subscriptionsEnabled: false },
	      });
	      await addOrder({ shop: "shop", sessionId: "sess", deposit: 10, customerId: "cust" });
      expect(prismaMock.shop.findUnique).toHaveBeenCalledWith({
        select: { data: true },
        where: { id: "shop" },
      });
      expect(trackOrder).toHaveBeenCalledWith("shop", "ID", 10);
      expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
    });

    it("skips subscription usage when shop not found", async () => {
      ulidMock.mockReturnValue("ID");
      nowIsoMock.mockReturnValue("now");
	      prismaMock.rentalOrder.create.mockResolvedValue({});
	      prismaMock.shop.findUnique.mockResolvedValue(null);
	      await addOrder({ shop: "shop", sessionId: "sess", deposit: 10, customerId: "cust" });
      expect(prismaMock.shop.findUnique).toHaveBeenCalledWith({
        select: { data: true },
        where: { id: "shop" },
      });
      expect(trackOrder).toHaveBeenCalledWith("shop", "ID", 10);
      expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
    });

	    it("throws when creation fails", async () => {
	      prismaMock.rentalOrder.create.mockRejectedValue(new Error("fail"));
	      await expect(
	        addOrder({ shop: "shop", sessionId: "sess", deposit: 10 }),
	      ).rejects.toThrow("fail");
	      expect(trackOrder).not.toHaveBeenCalled();
	    });
	  });

  describe("getOrdersForCustomer", () => {
    it("returns normalized orders", async () => {
      prismaMock.rentalOrder.findMany.mockResolvedValue([
        createOrder({ shop: "shop", customerId: "cust", foo: null }),
      ]);
      const result = await getOrdersForCustomer("shop", "cust");
      expect(prismaMock.rentalOrder.findMany).toHaveBeenCalledWith({
        where: { shop: "shop", customerId: "cust" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].foo).toBeUndefined();
    });

    it("throws when lookup fails", async () => {
      prismaMock.rentalOrder.findMany.mockRejectedValue(new Error("fail"));
      await expect(getOrdersForCustomer("shop", "cust")).rejects.toThrow(
        "fail"
      );
    });
  });

  describe("getOrdersForCustomer history", () => {
    it("returns normalized history sorted by startedAt", async () => {
      prismaMock.rentalOrder.findMany.mockResolvedValue([
        createOrder({
          shop: "shop",
          customerId: "cust",
          startedAt: "2024-01-01T00:00:00.000Z",
          fulfilledAt: "2024-01-02T00:00:00.000Z",
          foo: null,
        }),
        createOrder({
          id: "2",
          shop: "shop",
          customerId: "cust",
          startedAt: "2024-02-01T00:00:00.000Z",
          cancelledAt: "2024-02-02T00:00:00.000Z",
        }),
        createOrder({
          id: "3",
          shop: "shop",
          customerId: "cust",
          startedAt: "2024-03-01T00:00:00.000Z",
          returnedAt: "2024-03-02T00:00:00.000Z",
        }),
        createOrder({
          id: "4",
          shop: "shop",
          customerId: "cust",
          startedAt: "2024-04-01T00:00:00.000Z",
          refundedAt: "2024-04-02T00:00:00.000Z",
        }),
      ]);
      const result = await getOrdersForCustomer("shop", "cust");
      expect(prismaMock.rentalOrder.findMany).toHaveBeenCalledWith({
        where: { shop: "shop", customerId: "cust" },
      });
      expect(result.map((o) => o.id)).toEqual(["1", "2", "3", "4"]);
      expect(result.map((o) => o.startedAt)).toEqual([
        "2024-01-01T00:00:00.000Z",
        "2024-02-01T00:00:00.000Z",
        "2024-03-01T00:00:00.000Z",
        "2024-04-01T00:00:00.000Z",
      ]);
      expect(result[0].foo).toBeUndefined();
    });

    it("throws when lookup fails", async () => {
      prismaMock.rentalOrder.findMany.mockRejectedValue(new Error("fail"));
      await expect(getOrdersForCustomer("shop", "cust")).rejects.toThrow(
        "fail"
      );
    });
  });
});
