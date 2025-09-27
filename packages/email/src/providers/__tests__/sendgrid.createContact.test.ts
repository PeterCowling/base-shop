jest.mock("@sendgrid/mail", () => {
  const setApiKey = jest.fn();
  const send = jest.fn();
  return { __esModule: true, default: { setApiKey, send }, setApiKey, send };
});

import { createSendgridTestHarness } from "../../__tests__/sendgrid/setup";

describe("SendgridProvider createContact", () => {
  createSendgridTestHarness();

  it("returns the new contact id on success", async () => {
    process.env.SENDGRID_MARKETING_KEY = "mk";
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ persisted_recipients: ["abc"] }),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.createContact("test@example.com")).resolves.toBe(
      "abc"
    );
  });

  it("returns empty string when id missing", async () => {
    process.env.SENDGRID_MARKETING_KEY = "mk";
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.createContact("test@example.com")).resolves.toBe(
      ""
    );
  });

  it("returns empty string when fetch rejects", async () => {
    process.env.SENDGRID_MARKETING_KEY = "mk";
    global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.createContact("test@example.com")).resolves.toBe(
      ""
    );
  });

  it("returns empty string on json failure", async () => {
    process.env.SENDGRID_MARKETING_KEY = "mk";
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.reject(new Error("bad")),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.createContact("test@example.com")).resolves.toBe(
      ""
    );
  });

  it("returns empty string without API key", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.createContact("test@example.com")).resolves.toBe(
      ""
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
