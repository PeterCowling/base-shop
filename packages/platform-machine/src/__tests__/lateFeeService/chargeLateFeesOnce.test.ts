/** @jest-environment node */
import * as testSetup from "./testSetup";
import { chargeLateFeesOnce } from "../../lateFeeService";

const {
  readdirMock,
  readFileMock,
  stripeRetrieveMock,
  stripeChargeMock,
  readOrdersMock,
  markLateFeeChargedMock,
  loggerInfoMock,
  loggerErrorMock,
  NOW,
} = testSetup;

describe("chargeLateFeesOnce", () => {
  let dateSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.resetAllMocks();
    dateSpy = jest.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  it.each([
    ["no policy", {}],
    ["zero fee", { lateFeePolicy: { feeAmount: 0 } }],
  ])("skips charges when %s", async (_desc, shopJson) => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(JSON.stringify(shopJson));

    await chargeLateFeesOnce(undefined, "/data");

    expect(readOrdersMock).not.toHaveBeenCalled();
    expect(stripeRetrieveMock).not.toHaveBeenCalled();
    expect(stripeChargeMock).not.toHaveBeenCalled();
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });

  it("continues when shop policy cannot be loaded", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockRejectedValueOnce(new Error("boom"));

    await chargeLateFeesOnce(undefined, "/data");

    expect(readOrdersMock).not.toHaveBeenCalled();
    expect(stripeRetrieveMock).not.toHaveBeenCalled();
    expect(stripeChargeMock).not.toHaveBeenCalled();
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });

  it("continues processing shops with policy", async () => {
    readdirMock.mockResolvedValue(["s1", "s2"]);
    readFileMock.mockImplementation((p: string) => {
      if (p.endsWith("s1/shop.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 },
          })
        );
      if (p.endsWith("s2/shop.json")) return Promise.resolve("{}");
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

    await chargeLateFeesOnce(undefined, "/data");

    expect(readOrdersMock).toHaveBeenCalledTimes(1);
    expect(stripeChargeMock).toHaveBeenCalledTimes(1);
    expect(markLateFeeChargedMock).toHaveBeenCalledWith("s1", "sess1", 5);
  });

  it("charges overdue orders and logs success", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
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

    await chargeLateFeesOnce(undefined, "/data");

    expect(stripeChargeMock).toHaveBeenCalledWith({
      amount: 500,
      currency: "usd",
      customer: "cus_1",
      payment_method: "pm_1",
      off_session: true,
      confirm: true,
    });
    expect(markLateFeeChargedMock).toHaveBeenCalledWith("s1", "sess1", 5);
    expect(loggerInfoMock).toHaveBeenCalledWith("late fee charged", {
      shopId: "s1",
      sessionId: "sess1",
      amount: 5,
    });
  });

  it("defaults currency to usd when session omits it", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
    });
    stripeChargeMock.mockResolvedValueOnce({});

    await chargeLateFeesOnce(undefined, "/data");

    expect(stripeChargeMock).toHaveBeenCalledWith({
      amount: 500,
      currency: "usd",
      customer: "cus_1",
      payment_method: "pm_1",
      off_session: true,
      confirm: true,
    });
  });

  it("skips orders already returned, charged, or missing due date", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess_returned",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
        returnReceivedAt: new Date().toISOString(),
      },
      {
        sessionId: "sess_charged",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lateFeeCharged: 5,
      },
      { sessionId: "sess_no_due" },
    ]);

    await chargeLateFeesOnce(undefined, "/data");

    expect(stripeRetrieveMock).not.toHaveBeenCalled();
    expect(stripeChargeMock).not.toHaveBeenCalled();
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      "customer missing",
      {
        customer: undefined,
        payment_intent: { payment_method: "pm_1" },
        currency: "usd",
      },
    ],
    [
      "payment intent as string",
      { customer: "cus_1", payment_intent: "pi_1", currency: "usd" },
    ],
  ])("skips charge when %s", async (_desc, session) => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockResolvedValueOnce(session as any);

    await chargeLateFeesOnce(undefined, "/data");

    expect(stripeChargeMock).not.toHaveBeenCalled();
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });

  it("logs error when session retrieval fails", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
    readOrdersMock.mockResolvedValueOnce([
      {
        sessionId: "sess1",
        returnDueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    stripeRetrieveMock.mockRejectedValueOnce(new Error("boom"));

    await chargeLateFeesOnce(undefined, "/data");

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "late fee charge failed",
      expect.objectContaining({
        shopId: "s1",
        sessionId: "sess1",
        err: expect.any(Error),
      })
    );
    expect(stripeChargeMock).not.toHaveBeenCalled();
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });

  it("logs error when marking late fee fails", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
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
    markLateFeeChargedMock.mockRejectedValueOnce(new Error("boom"));

    await chargeLateFeesOnce(undefined, "/data");

    expect(stripeChargeMock).toHaveBeenCalledTimes(1);
    expect(markLateFeeChargedMock).toHaveBeenCalledWith("s1", "sess1", 5);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      "late fee charge failed",
      expect.objectContaining({
        shopId: "s1",
        sessionId: "sess1",
        err: expect.any(Error),
      })
    );
    expect(loggerInfoMock).not.toHaveBeenCalled();
  });

  it("logs error when charge fails", async () => {
    readdirMock.mockResolvedValue(["s1"]);
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } })
    );
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
    stripeChargeMock.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    await chargeLateFeesOnce(undefined, "/data");

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "late fee charge failed",
      expect.objectContaining({
        shopId: "s1",
        sessionId: "sess1",
        err: expect.any(Error),
      })
    );
    expect(markLateFeeChargedMock).not.toHaveBeenCalled();
  });
});
