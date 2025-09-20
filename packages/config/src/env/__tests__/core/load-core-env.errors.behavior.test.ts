/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { loadCoreEnv } from "../../core.ts";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
  EMAIL_FROM: "from@example.com",
};

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("loadCoreEnv errors and logging", () => {
  it("throws and logs issues for malformed env", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "fast",
      } as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });

  it("logs each issue and throws for missing required secrets", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    process.env.NODE_ENV = "production";
    const { loadCoreEnv: freshLoad } = await import("../../core.ts");
    expect(() => freshLoad({} as NodeJS.ProcessEnv)).toThrow(
      "Invalid core environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXTAUTH_SECRET"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("SESSION_SECRET"),
    );
    errorSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  it("logs and throws when required env vars are invalid", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        CMS_SPACE_URL: "not-a-url",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    errorSpy.mockRestore();
  });

  it("logs issues and throws for invalid optional vars", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        NEXT_PUBLIC_PHASE: 123 as unknown as string,
        LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: "abc",
        STOCK_ALERT_RECIPIENTS: 456 as unknown as string,
        STOCK_ALERT_WEBHOOK: "not-a-url",
        STOCK_ALERT_DEFAULT_THRESHOLD: "oops",
        STOCK_ALERT_RECIPIENT: "not-an-email",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_PHASE"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_RECIPIENTS"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_WEBHOOK"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_DEFAULT_THRESHOLD"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_RECIPIENT"),
    );
    errorSpy.mockRestore();
  });

  it("logs issues and throws for invalid deposit/reverse/late fee vars", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "yes",
        REVERSE_LOGISTICS_ENABLED: "maybe",
        LATE_FEE_INTERVAL_MS: "soon",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • REVERSE_LOGISTICS_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • LATE_FEE_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });

  it("logs all issues for mixed invalid variables", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        CMS_SPACE_URL: "not-a-url",
        DEPOSIT_RELEASE_ENABLED: "nope",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("CMS_SPACE_URL"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    errorSpy.mockRestore();
  });

  it("throws when required variables are invalid", () => {
    process.env = {
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "",
      SANITY_API_VERSION: "v1",
    } as unknown as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => loadCoreEnv(process.env)).toThrow(
      "Invalid core environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("CMS_SPACE_URL"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("CMS_ACCESS_TOKEN"),
    );
    errorSpy.mockRestore();
  });

  it("logs errors for malformed deposit env vars", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "yes",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • REVERSE_LOGISTICS_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });
});

