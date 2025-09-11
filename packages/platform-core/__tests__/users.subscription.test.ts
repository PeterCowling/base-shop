import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { setStripeSubscriptionId } from "../src/repositories/users.server";
import { readShop } from "../src/repositories/shops.server";
import { prisma } from "../src/db";

jest.mock("../src/repositories/shops.server", () => ({
  readShop: jest.fn(),
}));

jest.mock("../src/db", () => ({
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

    await setStripeSubscriptionId("user1", "sub123", "shop1");

    expect(readShopMock).toHaveBeenCalledWith("shop1");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { stripeSubscriptionId: "sub123" },
    });
  });

  it("skips update when subscriptions disabled", async () => {
    readShopMock.mockResolvedValue({ subscriptionsEnabled: false });

    await setStripeSubscriptionId("user1", "sub123", "shop1");

    expect(readShopMock).toHaveBeenCalledWith("shop1");
    expect(updateMock).not.toHaveBeenCalled();
  });
});

