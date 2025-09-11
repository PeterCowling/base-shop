import { describe, it, expect } from "@jest/globals";

process.env.EMAIL_FROM = "from@example.com";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { emailEnvSchema } = require("@acme/config/env/email");

describe("email provider", () => {
  it("validates sendgrid provider", () => {
    expect(() =>
      emailEnvSchema.parse({
        EMAIL_PROVIDER: "sendgrid",
        EMAIL_FROM: "from@example.com",
      } as any),
    ).toThrow();
    const env = emailEnvSchema.parse({
      EMAIL_PROVIDER: "sendgrid",
      SENDGRID_API_KEY: "key",
      EMAIL_FROM: "from@example.com",
    } as any);
    expect(env.EMAIL_PROVIDER).toBe("sendgrid");
  });

  it("validates resend provider", () => {
    expect(() =>
      emailEnvSchema.parse({
        EMAIL_PROVIDER: "resend",
        EMAIL_FROM: "from@example.com",
      } as any),
    ).toThrow();
    const env = emailEnvSchema.parse({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "key",
      EMAIL_FROM: "from@example.com",
    } as any);
    expect(env.EMAIL_PROVIDER).toBe("resend");
  });

  it("supports noop provider", () => {
    const env = emailEnvSchema.parse({
      EMAIL_PROVIDER: "noop",
      EMAIL_FROM: "from@example.com",
    } as any);
    expect(env.EMAIL_PROVIDER).toBe("noop");
  });
});

describe("from address", () => {
  it("normalizes and lowercases", () => {
    const env = emailEnvSchema.parse({
      CAMPAIGN_FROM: " Admin@Example.COM ",
      EMAIL_FROM: "from@example.com",
    } as any);
    expect(env.CAMPAIGN_FROM).toBe("admin@example.com");
  });

  it("omits when not provided", () => {
    const env = emailEnvSchema.parse({ EMAIL_FROM: "from@example.com" } as any);
    expect(env.CAMPAIGN_FROM).toBeUndefined();
  });
});

describe("smtp coercion", () => {
  it("coerces port and secure flags", () => {
    const env = emailEnvSchema.parse({
      SMTP_PORT: "25",
      SMTP_SECURE: "Yes",
      EMAIL_FROM: "from@example.com",
    } as any);
    expect(env.SMTP_PORT).toBe(25);
    expect(env.SMTP_SECURE).toBe(true);
  });

  it("rejects invalid smtp values", () => {
    expect(() =>
      emailEnvSchema.parse({
        SMTP_PORT: "oops",
        EMAIL_FROM: "from@example.com",
      } as any),
    ).toThrow("must be a number");
    expect(() =>
      emailEnvSchema.parse({
        SMTP_SECURE: "maybe",
        EMAIL_FROM: "from@example.com",
      } as any),
    ).toThrow("must be a boolean");
  });
});
