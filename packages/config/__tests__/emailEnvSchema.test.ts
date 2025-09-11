import { describe, expect, it } from "@jest/globals";

process.env.EMAIL_FROM = "from@example.com";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { emailEnvSchema } = require("../src/env/email");

const parse = (env: Record<string, string | undefined>) =>
  emailEnvSchema.safeParse({ EMAIL_FROM: "from@example.com", ...env });

describe("emailEnvSchema.safeParse", () => {
  it("converts SMTP_PORT to number", () => {
    const result = parse({ SMTP_PORT: "2525" });
    expect(result.success).toBe(true);
    expect(result.data?.SMTP_PORT).toBe(2525);
  });

  it("errors when SMTP_PORT is non-numeric", () => {
    const result = parse({ SMTP_PORT: "abc" });
    expect(result.success).toBe(false);
    expect(result.error.format().SMTP_PORT?._errors).toContain(
      "must be a number",
    );
  });

  it("omits SMTP_PORT when not provided", () => {
    const result = parse({});
    expect(result.success).toBe(true);
    expect(result.data?.SMTP_PORT).toBeUndefined();
  });

  it.each([
    ["true", true],
    ["false", false],
    ["1", true],
    ["0", false],
    ["yes", true],
    ["no", false],
  ])("coerces SMTP_SECURE=%s", (value, expected) => {
    const result = parse({ SMTP_SECURE: value });
    expect(result.success).toBe(true);
    expect(result.data?.SMTP_SECURE).toBe(expected);
  });

  it("errors when SMTP_SECURE is invalid", () => {
    const result = parse({ SMTP_SECURE: "maybe" });
    expect(result.success).toBe(false);
    expect(result.error.format().SMTP_SECURE?._errors).toContain(
      "must be a boolean",
    );
  });

  it("normalizes CAMPAIGN_FROM", () => {
    const result = parse({ CAMPAIGN_FROM: " USER@Example.com " });
    expect(result.success).toBe(true);
    expect(result.data?.CAMPAIGN_FROM).toBe("user@example.com");
  });

  it("errors for invalid CAMPAIGN_FROM", () => {
    const result = parse({ CAMPAIGN_FROM: "not-an-email" });
    expect(result.success).toBe(false);
    expect(result.error.format().CAMPAIGN_FROM?._errors).toContain(
      "Invalid email",
    );
  });

  describe("provider requirements", () => {
    const cases = [
      { provider: "smtp", env: { EMAIL_PROVIDER: "smtp" }, missing: undefined },
      {
        provider: "sendgrid",
        env: { EMAIL_PROVIDER: "sendgrid" },
        missing: "SENDGRID_API_KEY" as const,
      },
      {
        provider: "resend",
        env: { EMAIL_PROVIDER: "resend" },
        missing: "RESEND_API_KEY" as const,
      },
      { provider: "noop", env: { EMAIL_PROVIDER: "noop" }, missing: undefined },
    ];

    it.each(cases)("validates %s provider without keys", ({ env, missing }) => {
      const result = parse(env);
      if (missing) {
        expect(result.success).toBe(false);
        expect(result.error.format()[missing]?._errors).toContain("Required");
      } else {
        expect(result.success).toBe(true);
        expect(result.data?.EMAIL_PROVIDER).toBe(env.EMAIL_PROVIDER);
      }
    });

    it.each([
      { provider: "smtp", env: { EMAIL_PROVIDER: "smtp" } },
      {
        provider: "sendgrid",
        env: { EMAIL_PROVIDER: "sendgrid", SENDGRID_API_KEY: "sg" },
      },
      {
        provider: "resend",
        env: { EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re" },
      },
      { provider: "noop", env: { EMAIL_PROVIDER: "noop" } },
    ])("parses %s provider when keys supplied", ({ env }) => {
      const result = parse(env);
      expect(result.success).toBe(true);
      expect(result.data?.EMAIL_PROVIDER).toBe(env.EMAIL_PROVIDER);
    });
  });

  it("defaults EMAIL_PROVIDER to smtp and parses SMTP config", () => {
    const result = parse({
      SMTP_URL: "https://smtp.example.com",
      SMTP_PORT: "2525",
      SMTP_SECURE: "true",
    });
    expect(result.success).toBe(true);
    expect(result.data?.EMAIL_PROVIDER).toBe("smtp");
    expect(result.data?.SMTP_URL).toBe("https://smtp.example.com");
    expect(result.data?.SMTP_PORT).toBe(2525);
    expect(result.data?.SMTP_SECURE).toBe(true);
  });

  it("errors for invalid SMTP_URL", () => {
    const result = parse({ SMTP_URL: "not-a-url" });
    expect(result.success).toBe(false);
    expect(result.error.format().SMTP_URL?._errors).toContain("Invalid url");
  });

});
