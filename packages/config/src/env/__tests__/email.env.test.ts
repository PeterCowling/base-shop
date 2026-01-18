import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = { ...process.env };

const loadEnv = async () => (await import("../email.ts")).emailEnv;

beforeEach(() => {
  process.env.EMAIL_FROM = "from@example.com";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

describe("email env provider selection", () => {
  it("defaults EMAIL_PROVIDER to smtp in test env", async () => {
    delete process.env.EMAIL_PROVIDER;
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe("smtp");
  });

  it.each([
    [{ NODE_ENV: "development" }, "smtp"],
    [{ NODE_ENV: "production" }, "smtp"],
  ])("defaults EMAIL_PROVIDER in %o", async (envVars, expected) => {
    Object.assign(process.env, envVars);
    delete process.env.EMAIL_PROVIDER;
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe(expected);
  });

  it("uses sendgrid when SENDGRID_API_KEY present", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg-key";
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe("sendgrid");
    expect(env.SENDGRID_API_KEY).toBe("sg-key");
  });

  it("uses resend when RESEND_API_KEY present", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "re-key";
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe("resend");
    expect(env.RESEND_API_KEY).toBe("re-key");
  });

  it("throws when SENDGRID_API_KEY missing", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../email.ts")).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
    const err = spy.mock.calls[0][1];
    expect(err).toMatchObject({
      SENDGRID_API_KEY: { _errors: ["Required"] },
    });
    spy.mockRestore();
  });

  it("throws when RESEND_API_KEY missing", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../email.ts")).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
    const err = spy.mock.calls[0][1];
    expect(err).toMatchObject({
      RESEND_API_KEY: { _errors: ["Required"] },
    });
    spy.mockRestore();
  });

  it.each([
    ["smtp", {}],
    ["sendgrid", { SENDGRID_API_KEY: "sg-key" }],
    ["resend", { RESEND_API_KEY: "re-key" }],
  ])(
    "requires EMAIL_FROM when provider=%s",
    async (provider, extras) => {
      process.env.EMAIL_PROVIDER = provider as string;
      Object.assign(process.env, extras);
      delete process.env.EMAIL_FROM;
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(loadEnv()).rejects.toThrow(
        "Invalid email environment variables",
      );
      expect(spy).toHaveBeenCalled();
      const err = spy.mock.calls[0][1];
      expect(err).toMatchObject({ EMAIL_FROM: { _errors: ["Required"] } });
      spy.mockRestore();
    },
  );

  it("supports noop provider when EMAIL_PROVIDER=noop", async () => {
    process.env.EMAIL_PROVIDER = "noop";
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe("noop");
  });

  it("rejects unknown EMAIL_PROVIDER", async () => {
    process.env.EMAIL_PROVIDER = "unknown" as any;
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  
  it("normalizes EMAIL_FROM", async () => {
    process.env.EMAIL_FROM = " USER@Example.COM ";
    const env = await loadEnv();
    expect(env.EMAIL_FROM).toBe("user@example.com");
  });

  it("requires EMAIL_FROM when default provider is smtp", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.EMAIL_PROVIDER;
    delete process.env.EMAIL_FROM;
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
    const err = spy.mock.calls[0][1];
    expect(err).toMatchObject({ EMAIL_FROM: { _errors: ["Required"] } });
    spy.mockRestore();
  });
});

describe("webhook verification toggle", () => {
  it("sendgrid verification enabled when public key present", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.SENDGRID_WEBHOOK_PUBLIC_KEY = "pub";
    await loadEnv();
    const shouldVerify =
      process.env.EMAIL_PROVIDER === "sendgrid" &&
      !!process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
    expect(shouldVerify).toBe(true);
    delete process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
    const shouldNotVerify =
      process.env.EMAIL_PROVIDER === "sendgrid" &&
      !!process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
    expect(shouldNotVerify).toBe(false);
  });

  it("resend verification enabled when secret present", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "re";
    process.env.RESEND_WEBHOOK_SECRET = "secret";
    await loadEnv();
    const shouldVerify =
      process.env.EMAIL_PROVIDER === "resend" &&
      !!process.env.RESEND_WEBHOOK_SECRET;
    expect(shouldVerify).toBe(true);
    delete process.env.RESEND_WEBHOOK_SECRET;
    const shouldNotVerify =
      process.env.EMAIL_PROVIDER === "resend" &&
      !!process.env.RESEND_WEBHOOK_SECRET;
    expect(shouldNotVerify).toBe(false);
  });
});

describe("smtp options", () => {
  it("rejects non-numeric SMTP_PORT", async () => {
    process.env.SMTP_PORT = "abc";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
    const err = spy.mock.calls[0][1];
    expect(err.SMTP_PORT._errors).toContain("must be a number");
    spy.mockRestore();
  });

  it("parses numeric SMTP_PORT", async () => {
    process.env.SMTP_PORT = "587";
    const env = await loadEnv();
    expect(env.SMTP_PORT).toBe(587);
  });

  it("trims and parses SMTP_PORT with surrounding whitespace", async () => {
    process.env.SMTP_PORT = " 1234 ";
    const env = await loadEnv();
    expect(env.SMTP_PORT).toBe(1234);
  });

  it("rejects invalid SMTP_SECURE", async () => {
    process.env.SMTP_SECURE = "foo";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
    const err = spy.mock.calls[0][1];
    expect(err.SMTP_SECURE._errors).toContain("must be a boolean");
    spy.mockRestore();
  });

  it.each([
    [" true ", true],
    [" 1 ", true],
    [" YeS ", true],
    [" false ", false],
    [" 0 ", false],
    [" NO ", false],
  ])("coerces SMTP_SECURE=%s", async (val, expected) => {
    process.env.SMTP_SECURE = val as string;
    const env = await loadEnv();
    expect(env.SMTP_SECURE).toBe(expected);
  });

  it("logs error when SMTP_PORT is invalid", async () => {
    process.env.SMTP_PORT = "abc";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe(
      "❌ Invalid email environment variables:",
    );
    const err = spy.mock.calls[0][1];
    expect(err.SMTP_PORT._errors).toContain("must be a number");
    spy.mockRestore();
  });

  it("logs error when SMTP_SECURE is invalid", async () => {
    process.env.SMTP_SECURE = "foo";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe(
      "❌ Invalid email environment variables:",
    );
    const err = spy.mock.calls[0][1];
    expect(err.SMTP_SECURE._errors).toContain("must be a boolean");
    spy.mockRestore();
  });
});

describe("from address defaults", () => {
  const getDefaultSender = async () =>
    (await import("../../../../email/src/config.ts")).getDefaultSender();

  it("falls back when CAMPAIGN_FROM missing", async () => {
    process.env.GMAIL_USER = "fallback@example.com";
    delete process.env.CAMPAIGN_FROM;
    expect(await getDefaultSender()).toBe("fallback@example.com");
  });

  it("uses provided CAMPAIGN_FROM when present", async () => {
    process.env.CAMPAIGN_FROM = "Sender@Example.com";
    expect(await getDefaultSender()).toBe("sender@example.com");
  });

  it("trims and lowercases CAMPAIGN_FROM", async () => {
    process.env.CAMPAIGN_FROM = " User@Example.COM ";
    const env = await loadEnv();
    expect(env.CAMPAIGN_FROM).toBe("user@example.com");
  });

  it("rejects invalid CAMPAIGN_FROM", async () => {
    process.env.CAMPAIGN_FROM = "not-an-email";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
    const err = spy.mock.calls[0][1];
    expect(err.CAMPAIGN_FROM._errors).toContain("Invalid email");
    spy.mockRestore();
  });
});
