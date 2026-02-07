import { prisma } from "../../db";
import { readShop } from "../shops.server";
import { setStripeSubscriptionId } from "../users.server";

jest.mock("../shops.server", () => ({
  readShop: jest.fn(),
}));

jest.mock("../../db", () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

const readShopMock = readShop as jest.Mock;
const updateMock = prisma.user.update as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("setStripeSubscriptionId", () => {
  it("updates user when subscriptions enabled", async () => {
    readShopMock.mockResolvedValue({ subscriptionsEnabled: true });
    updateMock.mockResolvedValue(undefined);

    await setStripeSubscriptionId("user1", "sub123", "shop1");

    expect(readShopMock).toHaveBeenCalledWith("shop1");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { stripeSubscriptionId: "sub123" },
    });
  });

  it("sets subscription id to null when provided", async () => {
    readShopMock.mockResolvedValue({ subscriptionsEnabled: true });
    updateMock.mockResolvedValue(undefined);

    await setStripeSubscriptionId("user1", null, "shop1");

    expect(readShopMock).toHaveBeenCalledWith("shop1");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { stripeSubscriptionId: null },
    });
  });

  it("skips update when subscriptions disabled", async () => {
    readShopMock.mockResolvedValue({ subscriptionsEnabled: false });

    await setStripeSubscriptionId("user1", "sub123", "shop1");

    expect(readShopMock).toHaveBeenCalledWith("shop1");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("propagates prisma errors", async () => {
    readShopMock.mockResolvedValue({ subscriptionsEnabled: true });
    const err = new Error("db fail");
    updateMock.mockRejectedValue(err);

    await expect(
      setStripeSubscriptionId("user1", "sub123", "shop1"),
    ).rejects.toThrow("db fail");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { stripeSubscriptionId: "sub123" },
    });
  });
});

