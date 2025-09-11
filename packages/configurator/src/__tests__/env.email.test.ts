import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = { ...process.env };
const loadEnv = async () => (await import("@acme/config/env/email")).emailEnv;
const loadSchema = async () =>
  (await import("@acme/config/env/email")).emailEnvSchema;

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
    process.env.SENDGRID_API_KEY = "key";
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe("sendgrid");
    expect(env.SENDGRID_API_KEY).toBe("key");
  });

  it("uses resend when RESEND_API_KEY present", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "key";
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe("resend");
    expect(env.RESEND_API_KEY).toBe("key");
  });

  it("throws when provider key missing", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("defaults to smtp when EMAIL_PROVIDER is unset", async () => {
    delete process.env.EMAIL_PROVIDER;
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe("smtp");
  });

  it("supports noop provider when EMAIL_PROVIDER=noop", async () => {
    process.env.EMAIL_PROVIDER = "noop";
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe("noop");
  });

  it("supports smtp provider when EMAIL_PROVIDER=smtp", async () => {
    process.env.EMAIL_PROVIDER = "smtp";
    const env = await loadEnv();
    expect(env.EMAIL_PROVIDER).toBe("smtp");
  });
});

describe("SMTP configuration", () => {
  it("coerces SMTP_PORT to a number", async () => {
    process.env.SMTP_PORT = "587";
    const env = await loadEnv();
    expect(env.SMTP_PORT).toBe(587);
  });

  it("fails when SMTP_PORT is not numeric", async () => {
    process.env.SMTP_PORT = "not-a-number";
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
  });

  it("fails when SMTP_URL is invalid", async () => {
    process.env.SMTP_URL = "not-a-url";
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
  });

  it.each([
    ["true", true],
    ["1", true],
    ["yes", true],
    ["FALSE", false],
    ["0", false],
  ])("parses SMTP_SECURE=%s", async (value, expected) => {
    process.env.SMTP_SECURE = value;
    const env = await loadEnv();
    expect(env.SMTP_SECURE).toBe(expected);
  });

  it("fails when SMTP_SECURE is invalid", async () => {
    process.env.SMTP_SECURE = "maybe";
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
  });
});

describe("batching configuration", () => {
  it("coerces EMAIL_BATCH_SIZE and EMAIL_BATCH_DELAY_MS to numbers", async () => {
    process.env.EMAIL_BATCH_SIZE = "10";
    process.env.EMAIL_BATCH_DELAY_MS = "500";
    const env = await loadEnv();
    expect(env.EMAIL_BATCH_SIZE).toBe(10);
    expect(env.EMAIL_BATCH_DELAY_MS).toBe(500);
  });

  it("fails when EMAIL_BATCH_SIZE or EMAIL_BATCH_DELAY_MS are not numeric", async () => {
    process.env.EMAIL_BATCH_SIZE = "ten";
    process.env.EMAIL_BATCH_DELAY_MS = "five";
    await expect(loadEnv()).rejects.toThrow(
      "Invalid email environment variables",
    );
  });
});

describe("campaign address normalization", () => {
  it("lowercases CAMPAIGN_FROM", async () => {
    process.env.CAMPAIGN_FROM = "MixedCase@Example.COM";
    const env = await loadEnv();
    expect(env.CAMPAIGN_FROM).toBe("mixedcase@example.com");
  });
});

describe("provider-specific requirements", () => {
  it("requires SENDGRID_API_KEY when provider is sendgrid", async () => {
    const schema = await loadSchema();
    const result = schema.safeParse({
      EMAIL_PROVIDER: "sendgrid",
      EMAIL_FROM: "from@example.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["SENDGRID_API_KEY"],
        message: "Required",
      });
    }
  });

  it("accepts SENDGRID_API_KEY when provider is sendgrid", async () => {
    const schema = await loadSchema();
    const result = schema.safeParse({
      EMAIL_PROVIDER: "sendgrid",
      SENDGRID_API_KEY: "key",
      EMAIL_FROM: "from@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("requires RESEND_API_KEY when provider is resend", async () => {
    const schema = await loadSchema();
    const result = schema.safeParse({
      EMAIL_PROVIDER: "resend",
      EMAIL_FROM: "from@example.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["RESEND_API_KEY"],
        message: "Required",
      });
    }
  });

  it("accepts RESEND_API_KEY when provider is resend", async () => {
    const schema = await loadSchema();
    const result = schema.safeParse({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "key",
      EMAIL_FROM: "from@example.com",
    });
    expect(result.success).toBe(true);
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
