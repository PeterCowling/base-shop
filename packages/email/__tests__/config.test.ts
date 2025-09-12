describe("getProviderOrder configuration", () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  it("returns default order when no EMAIL_PROVIDER override", async () => {
    delete process.env.EMAIL_PROVIDER;
    const { getProviderOrder } = await import("../src/providers");
    expect(getProviderOrder()).toEqual(["smtp", "sendgrid", "resend"]);
  });

  it("places overridden provider first and keeps defaults", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    const { getProviderOrder } = await import("../src/providers");
    expect(getProviderOrder()).toEqual(["resend", "sendgrid", "smtp"]);
  });

  it("throws for invalid provider values", async () => {
    process.env.EMAIL_PROVIDER = "invalid";
    const { getProviderOrder } = await import("../src/providers");
    expect(() => getProviderOrder()).toThrow(
      'Unsupported EMAIL_PROVIDER "invalid". Available providers: sendgrid, resend, smtp'
    );
  });
});
