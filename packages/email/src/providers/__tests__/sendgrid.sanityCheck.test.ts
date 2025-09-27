jest.mock("@sendgrid/mail", () => {
  const setApiKey = jest.fn();
  const send = jest.fn();
  return { __esModule: true, default: { setApiKey, send }, setApiKey, send };
});

import { createSendgridTestHarness } from "../../__tests__/sendgrid/setup";

describe("SendgridProvider sanityCheck", () => {
  createSendgridTestHarness();

  it("resolves when credentials accepted", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider({ sanityCheck: true });
    await expect(provider.ready).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/user/profile",
      expect.objectContaining({ headers: { Authorization: "Bearer key" } })
    );
  });

  it("rejects when credentials rejected", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 401 }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider({ sanityCheck: true });
    await expect(provider.ready).rejects.toThrow(
      "Sendgrid credentials rejected with status 401"
    );
  });

  it("resolves immediately when API key missing", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider({ sanityCheck: true });
    await expect(provider.ready).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("resolves immediately when sanity check disabled", async () => {
    process.env.SENDGRID_API_KEY = "key";
    const fetchSpy = jest.spyOn(global, "fetch");
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.ready).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
