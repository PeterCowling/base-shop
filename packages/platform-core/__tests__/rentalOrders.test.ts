/** @jest-environment node */

import { getOrdersForCustomer } from "../src/orders/creation";
import * as repo from "../src/repositories/rentalOrders.server";

jest.mock("../src/analytics", () => ({ trackOrder: jest.fn() }));

describe("rental order repository", () => {
  it("returns empty array when no orders exist", async () => {
    expect(await repo.readOrders("test")).toEqual([]);
  });

  it("adds orders and updates status", async () => {
    const order = await repo.addOrder({
      shop: "test",
      sessionId: "sess",
      deposit: 42,
      expectedReturnDate: "2025-01-01",
    });
    expect(order).toMatchObject({
      sessionId: "sess",
      deposit: 42,
      expectedReturnDate: "2025-01-01",
      shop: "test",
    });

    let orders = await repo.readOrders("test");
    expect(orders).toHaveLength(1);

    const returned = await repo.markReturned("test", "sess");
    expect(returned?.returnedAt).toBeDefined();

    const refunded = await repo.markRefunded("test", "sess");
    expect(refunded?.refundedAt).toBeDefined();

    orders = await repo.readOrders("test");
    expect(orders[0].returnedAt).toBeDefined();
    expect(orders[0].refundedAt).toBeDefined();

    const missing = await repo.markReturned("test", "missing");
    expect(missing).toBeNull();
  });

  it("returns only orders for matching customer", async () => {
    const shop = "customer-test";
    await repo.addOrder({ shop, sessionId: "s1", deposit: 10, customerId: "cust1" });
    await repo.addOrder({ shop, sessionId: "s2", deposit: 20, customerId: "cust2" });
    await repo.addOrder({ shop, sessionId: "s3", deposit: 30, customerId: "cust1" });

    const cust1Orders = await getOrdersForCustomer(shop, "cust1");
    expect(cust1Orders).toHaveLength(2);
    expect(cust1Orders.map((o) => o.sessionId)).toEqual(["s1", "s3"]);

    const cust2Orders = await getOrdersForCustomer(shop, "cust2");
    expect(cust2Orders).toHaveLength(1);
    expect(cust2Orders[0].sessionId).toBe("s2");
  });

  it("has no side effects when marking unknown sessions", async () => {
    const shop = "missing-test";
    await repo.addOrder({ shop, sessionId: "known", deposit: 5 });

    const before = await repo.readOrders(shop);
    expect(before).toHaveLength(1);

    const returned = await repo.markReturned(shop, "unknown");
    const refunded = await repo.markRefunded(shop, "unknown");

    expect(returned).toBeNull();
    expect(refunded).toBeNull();

    const after = await repo.readOrders(shop);
    expect(after).toHaveLength(1);
    expect(after[0].returnedAt).toBeUndefined();
    expect(after[0].refundedAt).toBeUndefined();
  });
});
