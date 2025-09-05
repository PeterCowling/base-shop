import { getDefaultSender } from "@acme/email/config";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getDefaultSender", () => {
  it("throws when no sender environment variables are set", () => {
    delete process.env.CAMPAIGN_FROM;
    delete process.env.GMAIL_USER;
    expect(() => getDefaultSender()).toThrow("Default sender email is required");
  });

  it("throws for invalid sender email", () => {
    process.env.CAMPAIGN_FROM = "not-an-email";
    expect(() => getDefaultSender()).toThrow("Invalid sender email address");
  });

  it("returns normalized CAMPAIGN_FROM email", () => {
    process.env.CAMPAIGN_FROM = " Test@Example.COM ";
    expect(getDefaultSender()).toBe("test@example.com");
  });

  it("falls back to GMAIL_USER when CAMPAIGN_FROM is blank", () => {
    process.env.CAMPAIGN_FROM = " ";
    process.env.GMAIL_USER = "USER@EXAMPLE.COM";
    expect(getDefaultSender()).toBe("user@example.com");
  });

  it("throws when CAMPAIGN_FROM is blank and GMAIL_USER is unset", () => {
    process.env.CAMPAIGN_FROM = " ";
    delete process.env.GMAIL_USER;
    expect(() => getDefaultSender()).toThrow("Default sender email is required");
  });
});

