let service: typeof import("../releaseDepositsService");

const readdir = jest.fn();
jest.mock("node:fs/promises", () => ({ readdir }));

const retrieve = jest.fn();
const createRefund = jest.fn();
jest.mock(
  "@/lib/stripeServer",
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
jest.mock("@platform-core/repositories/rentalOrders", () => ({
  readOrders,
  markRefunded,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("releaseDepositsOnce", () => {
  it("refunds deposits and marks orders as refunded", async () => {
    service = await import("../releaseDepositsService");
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
});

describe("startDepositReleaseService", () => {
  it("schedules and clears interval", async () => {
    service = await import("../releaseDepositsService");
    readdir.mockResolvedValue([]);
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

    const stop = service.startDepositReleaseService(5000);
    await Promise.resolve();
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});