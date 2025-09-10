import { prisma } from "../../db";
import {
  markReceived,
  markRepair,
  markQa,
  markAvailable,
  markLateFeeCharged,
  readOrders,
  markRefunded,
} from "../rentalOrders.server";

jest.mock("@acme/date-utils", () => ({ nowIso: jest.fn() }));
import { nowIso } from "@acme/date-utils";

describe("rental orders status updates", () => {
  const shop = "test-shop";
  const sessionId = "session";
  const order = { id: 1 } as unknown as any;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("markReceived sets returnReceivedAt", async () => {
    const updated = { id: 1, returnReceivedAt: "now" } as unknown as any;
    (nowIso as jest.Mock).mockReturnValue("now");
    const updateMock = jest
      .spyOn(prisma.rentalOrder, "update")
      .mockResolvedValue(updated);

    await expect(markReceived(shop, sessionId)).resolves.toEqual(updated);
    expect(updateMock).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop, sessionId } },
      data: { status: "received", returnReceivedAt: "now" },
    });
  });

  it("markReceived returns null when update fails", async () => {
    jest
      .spyOn(prisma.rentalOrder, "update")
      .mockRejectedValue(new Error("fail"));
    await expect(markReceived(shop, sessionId)).resolves.toBeNull();
  });

  it.each([
    ["markRepair", () => markRepair(shop, sessionId), { status: "repair" }],
    ["markQa", () => markQa(shop, sessionId), { status: "qa" }],
    [
      "markAvailable",
      () => markAvailable(shop, sessionId),
      { status: "available" },
    ],
    [
      "markLateFeeCharged",
      () => markLateFeeCharged(shop, sessionId, 10),
      { lateFeeCharged: 10 },
    ],
  ])("returns updated order for %s", async (_, call, data) => {
    const updateMock = jest
      .spyOn(prisma.rentalOrder, "update")
      .mockResolvedValue(order);

    await expect(call()).resolves.toBe(order);
    expect(updateMock).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop, sessionId } },
      data,
    });
  });

  it.each([
    ["markRepair", () => markRepair(shop, sessionId)],
    ["markQa", () => markQa(shop, sessionId)],
    ["markAvailable", () => markAvailable(shop, sessionId)],
    ["markLateFeeCharged", () => markLateFeeCharged(shop, sessionId, 10)],
  ])("returns null when update fails for %s", async (_, call) => {
    jest
      .spyOn(prisma.rentalOrder, "update")
      .mockRejectedValue(new Error("fail"));

    await expect(call()).resolves.toBeNull();
  });
});

describe("rental orders read and refund", () => {
  const shop = "test-shop";
  const sessionId = "sess";

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("readOrders normalizes null values", async () => {
    jest
      .spyOn(prisma.rentalOrder, "findMany")
      .mockResolvedValue([{ id: 1, returnedAt: null }]);
    await expect(readOrders(shop)).resolves.toEqual([
      { id: 1, returnedAt: undefined },
    ]);
  });

  it("markRefunded returns updated order", async () => {
    (nowIso as jest.Mock).mockReturnValue("now");
    const update = jest
      .spyOn(prisma.rentalOrder, "update")
      .mockResolvedValue({ id: 1, refundedAt: "now", riskLevel: "low" });
    await expect(markRefunded(shop, sessionId, "low")).resolves.toEqual({
      id: 1,
      refundedAt: "now",
      riskLevel: "low",
    });
    expect(update).toHaveBeenCalledWith({
      where: { shop_sessionId: { shop, sessionId } },
      data: { refundedAt: "now", riskLevel: "low" },
    });
  });

  it("markRefunded returns null on error", async () => {
    jest
      .spyOn(prisma.rentalOrder, "update")
      .mockImplementation(() => {
        throw new Error("fail");
      });
    await expect(markRefunded(shop, sessionId)).resolves.toBeNull();
  });
});

