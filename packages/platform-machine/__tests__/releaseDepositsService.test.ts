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
  readFile.mockRejectedValue(new Error("no file"));
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
});

describe("startDepositReleaseService", () => {
  it("schedules and clears interval", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([]);
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(5000);
        return 123 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = service.startDepositReleaseService({
      shop1: { intervalMs: 5000 },
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});
