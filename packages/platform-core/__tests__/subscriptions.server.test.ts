import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { prisma } from "../src/db";
import {
  syncSubscriptionData,
  updateSubscriptionPaymentStatus,
} from "../src/repositories/subscriptions.server";

jest.mock("../src/db", () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

const updateMock = (prisma as any).user.update as jest.Mock;

beforeEach(() => {
  updateMock.mockReset();
});

describe("updateSubscriptionPaymentStatus", () => {
  it("sends correct parameters", async () => {
    updateMock.mockResolvedValue({});
    await updateSubscriptionPaymentStatus("cus_1", "sub_1", "succeeded");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "cus_1" },
      data: { stripeSubscriptionId: "sub_1" },
    });
  });

  it("propagates prisma errors", async () => {
    const err = new Error("db error");
    updateMock.mockRejectedValue(err);
    await expect(
      updateSubscriptionPaymentStatus("cus_1", "sub_1", "failed"),
    ).rejects.toThrow("db error");
  });
});

describe("syncSubscriptionData", () => {
  it("sends correct parameters", async () => {
    updateMock.mockResolvedValue({});
    await syncSubscriptionData("cus_1", "sub_1");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "cus_1" },
      data: { stripeSubscriptionId: "sub_1" },
    });
  });

  it("handles null subscription id", async () => {
    updateMock.mockResolvedValue({});
    await syncSubscriptionData("cus_1", null);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "cus_1" },
      data: { stripeSubscriptionId: null },
    });
  });

  it("propagates prisma errors", async () => {
    const err = new Error("db error");
    updateMock.mockRejectedValue(err);
    await expect(syncSubscriptionData("cus_1", "sub_1")).rejects.toThrow(
      "db error",
    );
  });
});

