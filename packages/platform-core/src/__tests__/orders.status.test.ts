/** @jest-environment node */

import { markReturned } from "../orders/status";

jest.mock("../db", () => ({
  prisma: {
    rentalOrder: { update: jest.fn() },
  },
}));

const { prisma } = jest.requireMock("../db") as {
  prisma: { rentalOrder: { update: jest.Mock } };
};

describe("orders/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets damage fee and returned timestamp", async () => {
    const mock = { id: "1", shop: "shop", sessionId: "sess", damageFee: 4, returnedAt: "now" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await markReturned("shop", "sess", 4);
    expect(result).toEqual(mock);
  });

  it("returns null when update throws", async () => {
    prisma.rentalOrder.update.mockImplementation(() => {
      throw new Error("not found");
    });
    await expect(markReturned("shop", "sess")).resolves.toBeNull();
  });
});

