import { jest } from "@jest/globals";
import type { TrackingStatus } from "../src/shipping";

jest.mock("@acme/email", () => ({ sendEmail: jest.fn() }));
jest.mock("../src/shipping", () => ({
  getTrackingStatus: jest.fn(async () => ({
    status: "Delivered",
    steps: [] as any[],
  })),
}));

describe("tracking dashboard", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test("aggregates built-in provider", async () => {
    const { getTrackingDashboard } = await import("../src/tracking");
    const result = await getTrackingDashboard([
      {
        id: "1",
        type: "shipment",
        provider: "ups",
        trackingNumber: "1Z",
      },
    ]);
    expect(result[0].status).toBe("Delivered");
  });

  test("supports custom provider", async () => {
    const custom = jest
      .fn<Promise<TrackingStatus>, [string]>()
      .mockResolvedValue({ status: "In Transit", steps: [] } as TrackingStatus);
    const { getTrackingDashboard } = await import("../src/tracking");
    const result = await getTrackingDashboard(
      [
        {
          id: "2",
          type: "return",
          provider: "third",
          trackingNumber: "XYZ",
        },
      ],
      { third: custom },
    );
    expect(custom).toHaveBeenCalledWith("XYZ");
    expect(result[0].status).toBe("In Transit");
  });

  test("notifies on status change", async () => {
    const sendEmail = (await import("@acme/email")).sendEmail as jest.Mock;
    global.fetch = jest
      .fn<Promise<any>, any>()
      .mockResolvedValue({ ok: true, json: async () => ({}) } as any) as any;
    process.env.TWILIO_SID = "sid";
    process.env.TWILIO_TOKEN = "tok";
    process.env.TWILIO_FROM = "+111";
    const { notifyStatusChange } = await import("../src/tracking");
    await notifyStatusChange(
      { email: "a@b.com", phone: "+1222" },
      { id: "1", type: "shipment", provider: "ups", trackingNumber: "1" },
      "old",
      "new",
    );
    expect(sendEmail).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalled();
  });
});
