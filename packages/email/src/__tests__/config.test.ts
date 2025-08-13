describe("getDefaultSender", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  it("throws when sender is missing", async () => {
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.GMAIL_USER;

    const { getDefaultSender } = await import("../config");
    expect(() => getDefaultSender()).toThrow(
      "Default sender email is required"
    );
  });

  it("throws when sender format is invalid", async () => {
    process.env = {
      ...OLD_ENV,
      CAMPAIGN_FROM: "invalid",
    } as NodeJS.ProcessEnv;
    delete process.env.GMAIL_USER;

    const { getDefaultSender } = await import("../config");
    expect(() => getDefaultSender()).toThrow(
      "Invalid sender email address: invalid"
    );
  });

  it("returns sender when valid", async () => {
    process.env = {
      ...OLD_ENV,
      CAMPAIGN_FROM: "sender@example.com",
    } as NodeJS.ProcessEnv;
    delete process.env.GMAIL_USER;

    const { getDefaultSender } = await import("../config");
    expect(getDefaultSender()).toBe("sender@example.com");
  });
});
