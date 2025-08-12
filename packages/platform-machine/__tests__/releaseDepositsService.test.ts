export {};

let service: typeof import("@acme/platform-machine");

const readdir = jest.fn();
const readFile = jest.fn();
jest.mock("node:fs/promises", () => ({ readdir, readFile }));

const retrieve = jest.fn();
const createRefund = jest.fn();
jest.mock(
  "@acme/stripe",
  () => ({
    stripe: {
      checkout: { sessions: { retrieve } },
      refunds: { create: createRefund },
    },
  }),
  { virtual: true }
);

const readOrders = jest.fn();
const markRefunded = jest.fn();
jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  readOrders,
  markRefunded,
}));

beforeEach(() => {
  jest.clearAllMocks();
  readFile.mockResolvedValue("{}");
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
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({});
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await service.releaseDepositsOnce();

    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenCalledTimes(2);
    expect(markRefunded).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "s2");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain("s1");
    expect(errorSpy.mock.calls[0][0]).toContain("shop1");

    errorSpy.mockRestore();
  });
});

describe("startDepositReleaseService", () => {
  it("uses per-shop configuration", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1", "shop2"]);
    readOrders.mockResolvedValue([]);
    readFile
      .mockResolvedValueOnce(
        JSON.stringify({ depositService: { enabled: true, intervalMinutes: 1 } })
      )
      .mockResolvedValueOnce(
        JSON.stringify({ depositService: { enabled: true, intervalMinutes: 1 } })
      );
    process.env.DEPOSIT_RELEASE_ENABLED_SHOP2 = "false";

    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(60000);
        return 123 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService();
    await Promise.resolve();
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();

    delete process.env.DEPOSIT_RELEASE_ENABLED_SHOP2;
  });

  it("runs each shop in parallel and schedules timers after initial run", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1", "shop2"]);
    readFile.mockResolvedValue("{}");

    const resolvers: Record<string, () => void> = {};
    readOrders.mockImplementation((shop: string) => {
      return new Promise((resolve) => {
        resolvers[shop] = () => resolve([]);
      });
    });

    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const startPromise = service.startDepositReleaseService();

    const flush = () => new Promise((r) => setTimeout(r, 0));

    await flush();
    expect(readOrders).toHaveBeenCalledTimes(2);
    expect(setSpy).not.toHaveBeenCalled();

    resolvers["shop1"]();
    await flush();
    expect(setSpy).toHaveBeenCalledTimes(1);

    resolvers["shop2"]();
    const stop = await startPromise;
    expect(setSpy).toHaveBeenCalledTimes(2);

    stop();
    expect(clearSpy).toHaveBeenCalledTimes(2);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});
