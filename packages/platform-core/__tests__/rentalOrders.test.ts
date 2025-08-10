import { jest } from "@jest/globals";

const mockOrders: any[] = [];

jest.mock("../src/db", () => ({
  prisma: {
    rentalOrder: {
      findMany: jest.fn(async ({ where }: any) =>
        mockOrders.filter(
          (o) =>
            o.shopId === where.shopId &&
            (!where.customerId || o.customerId === where.customerId)
        )
      ),
      create: jest.fn(async ({ data }: any) => {
        mockOrders.push(data);
        return data;
      }),
      findUnique: jest.fn(async ({ where }: any) =>
        mockOrders.find((o) => o.sessionId === where.sessionId) || null
      ),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = mockOrders.findIndex((o) => o.id === where.id);
        if (idx === -1) throw new Error("not found");
        mockOrders[idx] = { ...mockOrders[idx], ...data };
        return mockOrders[idx];
      }),
    },
  },
}));

import * as repo from "../src/repositories/rentalOrders.server";

describe("rental order repository", () => {
  it("returns empty array when no orders exist", async () => {
    expect(await repo.readOrders("test")).toEqual([]);
  });

  it("adds orders and updates status", async () => {
    const order = await repo.addOrder("test", "sess", 42, "2025-01-01");
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
});
