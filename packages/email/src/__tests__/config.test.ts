describe("getDefaultSender", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  it("returns CAMPAIGN_FROM when set and lowercases it", async () => {
    process.env = {
      ...OLD_ENV,
      CAMPAIGN_FROM: "Sender@Example.Com",
    } as NodeJS.ProcessEnv;
    delete process.env.GMAIL_USER;

    const { getDefaultSender } = await import("../config");
    expect(getDefaultSender()).toBe("sender@example.com");
  });

  it("trims CAMPAIGN_FROM before validating", async () => {
    process.env = {
      ...OLD_ENV,
      CAMPAIGN_FROM: " Sender@Example.Com ",
    } as NodeJS.ProcessEnv;
    delete process.env.GMAIL_USER;

    const { getDefaultSender } = await import("../config");
    expect(getDefaultSender()).toBe("sender@example.com");
  });

  it("uses GMAIL_USER when CAMPAIGN_FROM is absent", async () => {
    process.env = {
      ...OLD_ENV,
      GMAIL_USER: "User@Example.Com",
    } as NodeJS.ProcessEnv;
    delete process.env.CAMPAIGN_FROM;

    const { getDefaultSender } = await import("../config");
    expect(getDefaultSender()).toBe("user@example.com");
  });

  it("uses GMAIL_USER when CAMPAIGN_FROM is only whitespace", async () => {
    process.env = {
      ...OLD_ENV,
      CAMPAIGN_FROM: "   ",
      GMAIL_USER: "User@Example.Com",
    } as NodeJS.ProcessEnv;

    const { getDefaultSender } = await import("../config");
    expect(getDefaultSender()).toBe("user@example.com");
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
});
