jest.mock("../sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
}));

jest.mock("../resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
}));

describe("providers index", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_PROVIDER;
  });

  it("loadProvider caches instances", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    const { loadProvider } = await import("../index");
    const first = await loadProvider("sendgrid");
    const second = await loadProvider("sendgrid");
    expect(first).toBe(second);
  });

  it("getProviderOrder respects EMAIL_PROVIDER", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    const { getProviderOrder } = await import("../index");
    expect(getProviderOrder()[0]).toBe("resend");
  });

  it("getProviderOrder throws on invalid provider", async () => {
    process.env.EMAIL_PROVIDER = "bad";
    const { getProviderOrder } = await import("../index");
    expect(() => getProviderOrder()).toThrow("Unsupported EMAIL_PROVIDER");
  });
});

