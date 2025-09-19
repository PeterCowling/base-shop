import { createSendgridTestHarness } from "./setup";

createSendgridTestHarness();

describe("SendgridProvider ready", () => {
  it("throws when sanity check fails", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider({ sanityCheck: true });

    await expect(provider.ready).rejects.toThrow(
      "Sendgrid credentials rejected with status 401"
    );

    global.fetch = originalFetch;
  });

  it("resolves ready when sanity check passes", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider({ sanityCheck: true });

    await expect(provider.ready).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/user/profile",
      { headers: { Authorization: "Bearer sg" } }
    );
  });

  it("resolves ready immediately when sanity check disabled", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    const fetchSpy = jest.spyOn(global, "fetch");

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.ready).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
