/** @jest-environment node */
import { readdir, readFile } from "node:fs/promises";

jest.mock("node:fs/promises", () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
}));

jest.mock("@acme/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: jest.fn() } },
    refunds: { create: jest.fn() },
  },
}));

jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  readOrders: jest.fn(),
  markRefunded: jest.fn(),
}));

jest.mock("@platform-core/utils", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: {},
}));

import * as service from "../releaseDepositsService";
import { stripe } from "@acme/stripe";
import {
  readOrders,
  markRefunded,
} from "@platform-core/repositories/rentalOrders.server";
import { logger } from "@platform-core/utils";

const readdirMock = readdir as unknown as jest.Mock;
const stripeRetrieveMock = stripe.checkout.sessions
  .retrieve as unknown as jest.Mock;
const stripeRefundMock = stripe.refunds.create as unknown as jest.Mock;
const readOrdersMock = readOrders as jest.Mock;
const markRefundedMock = markRefunded as jest.Mock;
const loggerErrorMock = logger.error as jest.Mock;
const loggerInfoMock = logger.info as jest.Mock;

describe("releaseDepositsOnce", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("issues refund when positive and skips when non-positive", async () => {
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10, damageFee: 2 },
      { sessionId: "s2", returnedAt: "now", deposit: 10, damageFee: 12 },
    ]);
    stripeRetrieveMock.mockResolvedValue({ payment_intent: "pi" });

    await service.releaseDepositsOnce(undefined, "/data");

    expect(stripeRefundMock).toHaveBeenCalledTimes(1);
    expect(stripeRefundMock).toHaveBeenCalledWith({
      payment_intent: "pi",
      amount: 800,
    });
    expect(markRefundedMock).toHaveBeenCalledTimes(2);
  });

  it("handles object and missing payment_intent values", async () => {
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10, damageFee: 2 },
      { sessionId: "s2", returnedAt: "now", deposit: 10, damageFee: 2 },
      { sessionId: "s3", returnedAt: "now", deposit: 10, damageFee: 2 },
    ]);
    stripeRetrieveMock
      .mockResolvedValueOnce({ payment_intent: { id: "pi" } })
      .mockResolvedValueOnce({ payment_intent: {} })
      .mockResolvedValueOnce({});

    await service.releaseDepositsOnce(undefined, "/data");

    expect(stripeRefundMock).toHaveBeenCalledTimes(1);
    expect(stripeRefundMock).toHaveBeenCalledWith({
      payment_intent: "pi",
      amount: 800,
    });
    expect(markRefundedMock).toHaveBeenCalledTimes(1);
  });

  it("logs refund failures", async () => {
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
    ]);
    stripeRetrieveMock.mockResolvedValue({ payment_intent: "pi" });
    const err = new Error("boom");
    stripeRefundMock.mockRejectedValueOnce(err);
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await service.releaseDepositsOnce(undefined, "/data");

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "failed to release deposit for shop s1",
      { err }
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "failed to release deposit for shop s1",
      err
    );
    expect(markRefundedMock).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("logs session retrieval failures and leaves order unrefunded", async () => {
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
    ]);
    const err = new Error("boom");
    stripeRetrieveMock.mockRejectedValueOnce(err);
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await service.releaseDepositsOnce(undefined, "/data");

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "failed to release deposit for shop s1",
      { err }
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "failed to release deposit for shop s1",
      err
    );
    expect(stripeRefundMock).not.toHaveBeenCalled();
    expect(markRefundedMock).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("logs markRefunded failures and stops further processing", async () => {
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
    ]);
    stripeRetrieveMock.mockResolvedValue({ payment_intent: "pi" });
    const err = new Error("boom");
    markRefundedMock.mockRejectedValueOnce(err);
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await service.releaseDepositsOnce(undefined, "/data");

    expect(stripeRefundMock).toHaveBeenCalledTimes(1);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      "failed to release deposit for shop s1",
      { err }
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "failed to release deposit for shop s1",
      err
    );
    expect(loggerInfoMock).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("skips orders without return or already refunded", async () => {
    readdirMock.mockResolvedValue(["shop"]);
    readOrdersMock.mockResolvedValue([
      { sessionId: "s1", deposit: 10 },
      { sessionId: "s2", returnedAt: "now", deposit: 10, refundedAt: "y" },
    ]);

    await service.releaseDepositsOnce(undefined, "/data");

    expect(stripeRetrieveMock).not.toHaveBeenCalled();
    expect(stripeRefundMock).not.toHaveBeenCalled();
    expect(markRefundedMock).not.toHaveBeenCalled();
  });

  it("processes only specified shop without reading directory", async () => {
    readOrdersMock.mockResolvedValue([]);

    await service.releaseDepositsOnce("shopA", "/data");

    expect(readdirMock).not.toHaveBeenCalled();
    expect(readOrdersMock).toHaveBeenCalledWith("shopA");
  });
});

