jest.mock("@sendgrid/mail", () => {
  const setApiKey = jest.fn();
  const send = jest.fn();
  return { __esModule: true, default: { setApiKey, send }, setApiKey, send };
});

import { createSendgridTestHarness } from "../../__tests__/sendgrid/setup";

describe("SendgridProvider listSegments", () => {
  createSendgridTestHarness();

  it("returns [] without API key", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.listSegments()).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("maps API responses", async () => {
    process.env.SENDGRID_MARKETING_KEY = "mk";
    const payload = { result: [{ id: "1", name: "Segment", extra: "x" }] };
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(payload),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.listSegments()).resolves.toEqual([
      { id: "1", name: "Segment" },
    ]);
  });

  it("returns [] on errors", async () => {
    process.env.SENDGRID_MARKETING_KEY = "mk";
    global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.listSegments()).resolves.toEqual([]);
  });
});
