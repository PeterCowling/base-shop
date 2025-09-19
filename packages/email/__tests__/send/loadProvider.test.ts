describe("loadProvider", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
  });

  it("returns SendgridProvider when API key is set and caches the result", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    const ctor = jest.fn().mockImplementation(() => ({ send: jest.fn() }));
    jest.doMock("../../src/providers/sendgrid", () => ({ SendgridProvider: ctor }));
    const { loadProvider } = await import("../../src/send");
    const first = await loadProvider("sendgrid");
    const second = await loadProvider("sendgrid");
    expect(first).toBeDefined();
    expect(first).toBe(second);
    expect(ctor).toHaveBeenCalledTimes(1);
  });

  it("returns ResendProvider when API key is set", async () => {
    process.env.RESEND_API_KEY = "rs";
    const ctor = jest.fn().mockImplementation(() => ({ send: jest.fn() }));
    jest.doMock("../../src/providers/resend", () => ({ ResendProvider: ctor }));
    const { loadProvider } = await import("../../src/send");
    const provider = await loadProvider("resend");
    expect(provider).toBeDefined();
    expect(ctor).toHaveBeenCalledTimes(1);
  });

  it("returns undefined when API key is missing and caches the result", async () => {
    const ctor = jest.fn().mockImplementation(() => ({ send: jest.fn() }));
    jest.doMock("../../src/providers/sendgrid", () => ({ SendgridProvider: ctor }));
    const { SendgridProvider } = await import("../../src/providers/sendgrid");
    new SendgridProvider();
    const { loadProvider } = await import("../../src/send");
    const first = await loadProvider("sendgrid");
    const second = await loadProvider("sendgrid");
    expect(first).toBeUndefined();
    expect(second).toBeUndefined();
    expect(ctor).toHaveBeenCalledTimes(1);
  });
});
