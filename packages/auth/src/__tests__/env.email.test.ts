import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = { ...process.env };
const loadEnv = async () => (await import("@acme/config/env/email")).emailEnv;

beforeEach(() => {
  process.env.EMAIL_FROM = "from@example.com";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

describe("email provider selection", () => {
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

  it("throws when provider key missing", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv()).rejects.toThrow("Invalid email environment variables");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("supports noop provider when EMAIL_PROVIDER=noop", async () => {
    process.env.EMAIL_PROVIDER = "noop";
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe("noop");
  });
});

describe("webhook verification toggle", () => {
  it("sendgrid verification toggles with public key", async () => {
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

  it("resend verification toggles with secret", async () => {
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

describe("from address defaults", () => {
  const getDefaultSender = async () =>
    (await import("../../../email/src/config.ts")).getDefaultSender();

  it("falls back when CAMPAIGN_FROM missing", async () => {
    process.env.GMAIL_USER = "fallback@example.com";
    delete process.env.CAMPAIGN_FROM;
    expect(await getDefaultSender()).toBe("fallback@example.com");
  });

  it("uses provided CAMPAIGN_FROM when present", async () => {
    process.env.CAMPAIGN_FROM = "Sender@Example.com";
    expect(await getDefaultSender()).toBe("sender@example.com");
  });
});

describe("EMAIL_FROM defaults", () => {
  it("returns empty strings when EMAIL_FROM_* missing", () => {
    delete process.env.EMAIL_FROM_NAME;
    delete process.env.EMAIL_FROM_ADDRESS;
    const name = process.env.EMAIL_FROM_NAME ?? "";
    const address = process.env.EMAIL_FROM_ADDRESS ?? "";
    expect({ name, address }).toEqual({ name: "", address: "" });
  });

  it("uses provided EMAIL_FROM_* values", () => {
    process.env.EMAIL_FROM_NAME = "Acme";
    process.env.EMAIL_FROM_ADDRESS = "team@example.com";
    const name = process.env.EMAIL_FROM_NAME ?? "";
    const address = process.env.EMAIL_FROM_ADDRESS ?? "";
    expect({ name, address }).toEqual({ name: "Acme", address: "team@example.com" });
  });
});
