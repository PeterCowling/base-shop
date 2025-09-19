import { logger } from "@platform-core/utils";
import {
  resetReleaseDepositsEnv,
  restoreOriginalEnv,
  readdir,
  readFile,
  retrieve,
  createRefund,
  readOrders,
  markRefunded,
} from "./helpers/releaseDepositsSetup";

let service: typeof import("@acme/platform-machine");

beforeEach(() => {
  resetReleaseDepositsEnv();
});

afterEach(() => {
  restoreOriginalEnv();
});

describe("releaseDepositsOnce", () => {
  it("refunds deposits and marks orders as refunded", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      {
        sessionId: "sess1",
        returnedAt: "now",
        deposit: 10,
        damageFee: 2,
      },
      {
        sessionId: "sess2",
        returnedAt: "now",
        deposit: 10,
        damageFee: 12,
      },
      {
        sessionId: "sess3",
        deposit: 10,
      },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi_1" });

    await service.releaseDepositsOnce();

    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenCalledTimes(1);
    expect(createRefund).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 800,
    });
    expect(markRefunded).toHaveBeenCalledTimes(2);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "sess1");
    expect(markRefunded).toHaveBeenCalledWith("shop1", "sess2");
  });

  it("logs info after refunding a deposit", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      {
        sessionId: "s1",
        returnedAt: "now",
        deposit: 10,
        damageFee: 2,
      },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi_1" });
    const logSpy = jest
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    await service.releaseDepositsOnce();

    expect(createRefund).toHaveBeenCalledTimes(1);
    expect(createRefund).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 800,
    });
    expect(logSpy).toHaveBeenCalledWith("refunded deposit", {
      shopId: "shop1",
      sessionId: "s1",
    });

    logSpy.mockRestore();
  });

  it("handles multiple shops", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1", "shop2"]);
    readOrders
      .mockResolvedValueOnce([
        {
          sessionId: "s1",
          returnedAt: "now",
          deposit: 10,
        },
        {
          sessionId: "s2",
          deposit: 5,
        },
      ])
      .mockResolvedValueOnce([
        {
          sessionId: "s3",
          returnedAt: "now",
          deposit: 5,
        },
      ]);
    retrieve.mockResolvedValue({ payment_intent: "pi_1" });

    await service.releaseDepositsOnce();

    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenNthCalledWith(1, {
      payment_intent: "pi_1",
      amount: 1000,
    });
    expect(createRefund).toHaveBeenNthCalledWith(2, {
      payment_intent: "pi_1",
      amount: 500,
    });
    expect(markRefunded).toHaveBeenCalledTimes(2);
    expect(markRefunded).toHaveBeenNthCalledWith(1, "shop1", "s1");
    expect(markRefunded).toHaveBeenNthCalledWith(2, "shop2", "s3");
  });

  it("logs and continues on errors", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
      { sessionId: "s2", returnedAt: "now", deposit: 10 },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi_1" });
    createRefund
      .mockImplementationOnce(() => {
        throw new Error("fail");
      })
      .mockResolvedValueOnce({});
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const logSpy = jest
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);

    await service.releaseDepositsOnce();

    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenCalledTimes(2);
    expect(markRefunded).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "s2");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("s1");
    expect(consoleSpy.mock.calls[0][0]).toContain("shop1");
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain("s1");
    expect(logSpy.mock.calls[0][0]).toContain("shop1");

    consoleSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("logs errors and continues processing remaining orders", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
      { sessionId: "s2", returnedAt: "now", deposit: 10 },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi_1" });
    const err = new Error("fail");
    createRefund
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce({});
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const logSpy = jest
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);

    await service.releaseDepositsOnce();

    expect(logSpy).toHaveBeenCalledWith(
      "failed to release deposit for shop1 s1",
      { err },
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "failed to release deposit for shop1 s1",
      err,
    );
    expect(createRefund).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenNthCalledWith(2, {
      payment_intent: "pi_1",
      amount: 1000,
    });
    expect(markRefunded).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "s2");

    consoleSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("skips orders when no payment intent is returned", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
      { sessionId: "s2", returnedAt: "now", deposit: 10 },
    ]);
    retrieve.mockResolvedValueOnce({}).mockResolvedValueOnce({ payment_intent: "pi_2" });

    await service.releaseDepositsOnce();

    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "s2");
  });
});
