import { describe, expect, it } from "@jest/globals";
import { emailEnvSchema } from "../src/env/email";

const parse = (env: Record<string, string | undefined>) =>
  emailEnvSchema.safeParse(env);

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

  it.each([
    ["true", true],
    ["YES", true],
    ["no", false],
    ["0", false],
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

  it("requires SENDGRID_API_KEY for sendgrid provider", () => {
    const result = parse({ EMAIL_PROVIDER: "sendgrid" });
    expect(result.success).toBe(false);
    expect(result.error.format().SENDGRID_API_KEY?._errors).toContain(
      "Required",
    );
  });

  it("requires RESEND_API_KEY for resend provider", () => {
    const result = parse({ EMAIL_PROVIDER: "resend" });
    expect(result.success).toBe(false);
    expect(result.error.format().RESEND_API_KEY?._errors).toContain(
      "Required",
    );
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

  it.each(["smtp", "noop"]) (
    "allows %s provider without API keys",
    (provider) => {
      const result = parse({ EMAIL_PROVIDER: provider });
      expect(result.success).toBe(true);
      expect(result.data?.EMAIL_PROVIDER).toBe(provider);
    },
  );
});
