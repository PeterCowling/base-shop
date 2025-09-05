import { prisma } from "../../db";
import {
  markReceived,
  markCleaning,
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

  it("returns updated order when update succeeds", async () => {
    const updateMock = jest
      .spyOn(prisma.rentalOrder, "update")
      .mockResolvedValue(order);
    (nowIso as jest.Mock).mockReturnValue("now");

    await expect(markReceived(shop, sessionId)).resolves.toBe(order);
    expect(updateMock).toHaveBeenNthCalledWith(1, {
      where: { shop_sessionId: { shop, sessionId } },
      data: { status: "received", returnReceivedAt: "now" },
    });

    await expect(markCleaning(shop, sessionId)).resolves.toBe(order);
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      where: { shop_sessionId: { shop, sessionId } },
      data: { status: "cleaning" },
    });

    await expect(markRepair(shop, sessionId)).resolves.toBe(order);
    expect(updateMock).toHaveBeenNthCalledWith(3, {
      where: { shop_sessionId: { shop, sessionId } },
      data: { status: "repair" },
    });

    await expect(markQa(shop, sessionId)).resolves.toBe(order);
    expect(updateMock).toHaveBeenNthCalledWith(4, {
      where: { shop_sessionId: { shop, sessionId } },
      data: { status: "qa" },
    });

    await expect(markAvailable(shop, sessionId)).resolves.toBe(order);
    expect(updateMock).toHaveBeenNthCalledWith(5, {
      where: { shop_sessionId: { shop, sessionId } },
      data: { status: "available" },
    });

    const amount = 10;
    await expect(markLateFeeCharged(shop, sessionId, amount)).resolves.toBe(order);
    expect(updateMock).toHaveBeenNthCalledWith(6, {
      where: { shop_sessionId: { shop, sessionId } },
      data: { lateFeeCharged: amount },
    });
  });

  it("returns null when update fails", async () => {
    const updateMock = jest
      .spyOn(prisma.rentalOrder, "update")
      .mockRejectedValue(new Error("fail"));
    (nowIso as jest.Mock).mockReturnValue("now");

    await expect(markReceived(shop, sessionId)).resolves.toBeNull();
    await expect(markCleaning(shop, sessionId)).resolves.toBeNull();
    await expect(markRepair(shop, sessionId)).resolves.toBeNull();
    await expect(markQa(shop, sessionId)).resolves.toBeNull();
    await expect(markAvailable(shop, sessionId)).resolves.toBeNull();
    await expect(markLateFeeCharged(shop, sessionId, 1)).resolves.toBeNull();

    expect(updateMock).toHaveBeenCalledTimes(6);
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
      .mockRejectedValue(new Error("fail"));
    await expect(markRefunded(shop, sessionId)).resolves.toBeNull();
  });
});

