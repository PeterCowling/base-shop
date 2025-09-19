/** @jest-environment node */
import * as testSetup from "./testSetup";
import * as lateFeeService from "../../lateFeeService";

const {
  readdirMock,
  readFileMock,
  stripeRetrieveMock,
  stripeChargeMock,
  readOrdersMock,
  loggerErrorMock,
  NOW,
} = testSetup;

const { startLateFeeService } = lateFeeService;

describe("startLateFeeService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(global, "setInterval")
      .mockReturnValue({} as unknown as NodeJS.Timeout);
    jest.spyOn(global, "clearInterval");
    (testSetup.coreEnv as any).LATE_FEE_INTERVAL_MS = undefined;
    delete process.env.LATE_FEE_INTERVAL_MS_S1;
    delete process.env.LATE_FEE_ENABLED_S1;
  });

  afterEach(() => {
    (global.setInterval as jest.Mock).mockRestore();
    (global.clearInterval as jest.Mock).mockRestore();
  });

  it("returns early for sale type shops", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (p.endsWith("shop.json"))
        return Promise.resolve(
          JSON.stringify({ type: "sale", lateFeePolicy: { feeAmount: 5 } })
        );
      return Promise.resolve("{}");
    });

    await startLateFeeService({}, "/data");

    expect(global.setInterval as jest.Mock).not.toHaveBeenCalled();
  });

  it("skips shops without late fee policy", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (p.endsWith("shop.json")) return Promise.resolve("{}");
      return Promise.resolve("{}");
    });

    await startLateFeeService({}, "/data");

    expect(global.setInterval as jest.Mock).not.toHaveBeenCalled();
  });

  it("skips shops when policy fails to load", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (p.endsWith("shop.json")) return Promise.reject(new Error("boom"));
      return Promise.resolve("{}");
    });
    const chargeSpy = jest
      .spyOn(lateFeeService, "chargeLateFeesOnce")
      .mockResolvedValue(undefined);

    await startLateFeeService({}, "/data");

    expect(chargeSpy).not.toHaveBeenCalled();
    expect(global.setInterval as jest.Mock).not.toHaveBeenCalled();
    chargeSpy.mockRestore();
  });

  it("schedules runs and allows cleanup", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (p.endsWith("shop.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 },
          })
        );
      return Promise.resolve("{}");
    });
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
      currency: "usd",
    });
    stripeChargeMock.mockResolvedValueOnce({});

    const cleanup = await startLateFeeService({}, "/data");

    const shopCalls = readFileMock.mock.calls.filter((c) =>
      c[0].endsWith("s1/shop.json")
    );
    expect(shopCalls.length).toBe(2);
    const timer = (global.setInterval as jest.Mock).mock.results[0].value;
    expect((global.setInterval as jest.Mock).mock.calls[0][1]).toBe(60 * 1000);

    cleanup();
    expect(global.clearInterval).toHaveBeenCalledWith(timer);
  });

  it("logs errors from chargeLateFeesOnce", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (p.endsWith("shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 5 } })
        );
      return Promise.resolve("{}");
    });
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
      currency: "usd",
    });
    stripeChargeMock.mockRejectedValueOnce(new Error("boom"));

    await startLateFeeService({}, "/data");

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "late fee charge failed",
      expect.objectContaining({
        shopId: "s1",
        sessionId: "sess1",
        err: expect.any(Error),
      })
    );
  });
});
