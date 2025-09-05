import { afterEach, describe, expect, it } from "@jest/globals";
import { getDefaultSender } from "@acme/email/config";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getDefaultSender", () => {
  it("throws when no default sender variables are set", () => {
    delete process.env.CAMPAIGN_FROM;
    delete process.env.GMAIL_USER;
    expect(() => getDefaultSender()).toThrow(
      "Default sender email is required"
    );
  });

  it("throws for invalid CAMPAIGN_FROM", () => {
    process.env.CAMPAIGN_FROM = "not-an-email";
    expect(() => getDefaultSender()).toThrow(
      "Invalid sender email address"
    );
  });

  it("returns normalized CAMPAIGN_FROM", () => {
    process.env.CAMPAIGN_FROM = " Test@Example.COM ";
    expect(getDefaultSender()).toBe("test@example.com");
  });

  it("falls back to GMAIL_USER when CAMPAIGN_FROM empty", () => {
    process.env.CAMPAIGN_FROM = "";
    process.env.GMAIL_USER = "USER@EXAMPLE.COM";
    expect(getDefaultSender()).toBe("user@example.com");
  });

  it("trims CAMPAIGN_FROM and throws if empty after trimming", () => {
    process.env.CAMPAIGN_FROM = " ";
    delete process.env.GMAIL_USER;
    expect(() => getDefaultSender()).toThrow(
      "Default sender email is required"
    );
  });
});

