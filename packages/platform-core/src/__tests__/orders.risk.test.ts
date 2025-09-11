/** @jest-environment node */

import { updateRisk } from "../orders/risk";

jest.mock("../db", () => ({
  prisma: {
    rentalOrder: { update: jest.fn() },
  },
}));

const { prisma } = jest.requireMock("../db") as {
  prisma: { rentalOrder: { update: jest.Mock } };
};

describe("orders/risk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates risk fields", async () => {
    const mock = { id: "1", shop: "shop", sessionId: "sess", riskLevel: "low" };
    prisma.rentalOrder.update.mockResolvedValue(mock);
    const result = await updateRisk("shop", "sess", "low", 1, false);
    expect(result).toEqual(mock);
  });

  it("returns null for missing order", async () => {
    prisma.rentalOrder.update.mockRejectedValue(new Error("missing"));
    const result = await updateRisk("shop", "sess");
    expect(result).toBeNull();
  });
});

