import { createSendgridTestHarness } from "../../__tests__/sendgrid/setup";

jest.mock("@sendgrid/mail", () => {
  const setApiKey = jest.fn();
  const send = jest.fn();
  return { __esModule: true, default: { setApiKey, send }, setApiKey, send };
});

describe("SendgridProvider addToList", () => {
  createSendgridTestHarness();

  it("adds contact to list when API key present", async () => {
    process.env.SENDGRID_MARKETING_KEY = "mk";
    global.fetch = jest.fn().mockResolvedValue({}) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.addToList("c1", "l1")).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/marketing/lists/l1/contacts",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("skips when API key missing", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.addToList("c1", "l1")).resolves.toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("swallows network failures", async () => {
    process.env.SENDGRID_MARKETING_KEY = "mk";
    global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.addToList("c1", "l1")).resolves.toBeUndefined();
  });
});
