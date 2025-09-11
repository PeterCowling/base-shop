/** @jest-environment node */

import { markRefunded } from "../orders/refunds";

jest.mock("../db", () => ({
  prisma: {
    rentalOrder: { update: jest.fn() },
  },
}));

const { prisma } = jest.requireMock("../db") as {
  prisma: { rentalOrder: { update: jest.Mock } };
};

describe("orders/refunds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records refund timestamp", async () => {
    const mock = { id: "1", shop: "shop", sessionId: "sess", refundedAt: "now" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await markRefunded("shop", "sess");
    expect(result).toEqual(mock);
    expect(result?.refundedAt).toBe("now");
  });

  it("returns null when update throws", async () => {
    prisma.rentalOrder.update.mockImplementation(() => {
      throw new Error("missing");
    });
    const result = await markRefunded("shop", "sess");
    expect(result).toBeNull();
  });
});

