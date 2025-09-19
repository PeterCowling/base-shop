/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";

import { parseWithDepositSchema } from "./core.test-helpers.ts";

describe("core env optional variables", () => {
  it.each([
    ["1", true],
    ["", false],
  ])("coerces OUTPUT_EXPORT=%s to %s", (val, expected) => {
    const parsed = parseWithDepositSchema({ OUTPUT_EXPORT: val });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.OUTPUT_EXPORT).toBe(expected);
    }
  });

  it.each(["development", "test", "production"]) (
    "accepts NODE_ENV=%s",
    (value) => {
      const parsed = parseWithDepositSchema({ NODE_ENV: value });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.NODE_ENV).toBe(value);
      }
    },
  );

  it("rejects invalid NODE_ENV", () => {
    const parsed = parseWithDepositSchema({ NODE_ENV: "staging" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["NODE_ENV"] }),
        ]),
      );
    }
  });

  it("parses numeric CART_TTL when valid", () => {
    const parsed = parseWithDepositSchema({ CART_TTL: "123" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.CART_TTL).toBe(123);
    }
  });

  it("allows missing optional CART_TTL", () => {
    const parsed = parseWithDepositSchema();
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.CART_TTL).toBeUndefined();
    }
  });

  it("reports non-numeric CART_TTL", () => {
    const parsed = parseWithDepositSchema({ CART_TTL: "not-a-number" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["CART_TTL"],
        message: expect.stringContaining("Expected number"),
      });
    }
  });

  it("parses optional GA_API_SECRET when string", () => {
    const parsed = parseWithDepositSchema({ GA_API_SECRET: "secret" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.GA_API_SECRET).toBe("secret");
    }
  });

  it("reports non-string GA_API_SECRET", () => {
    const parsed = parseWithDepositSchema({
      GA_API_SECRET: 123 as unknown as string,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["GA_API_SECRET"],
        message: expect.stringContaining("Expected string"),
      });
    }
  });

  it("parses optional DATABASE_URL when string", () => {
    const parsed = parseWithDepositSchema({ DATABASE_URL: "postgres://example" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.DATABASE_URL).toBe("postgres://example");
    }
  });

  it("reports non-string DATABASE_URL", () => {
    const parsed = parseWithDepositSchema({
      DATABASE_URL: 456 as unknown as string,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["DATABASE_URL"],
        message: expect.stringContaining("Expected string"),
      });
    }
  });

  it("parses optional CLOUDFLARE_ACCOUNT_ID when string", () => {
    const parsed = parseWithDepositSchema({ CLOUDFLARE_ACCOUNT_ID: "cf-account" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.CLOUDFLARE_ACCOUNT_ID).toBe("cf-account");
    }
  });

  it("reports non-string CLOUDFLARE_ACCOUNT_ID", () => {
    const parsed = parseWithDepositSchema({
      CLOUDFLARE_ACCOUNT_ID: 789 as unknown as string,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["CLOUDFLARE_ACCOUNT_ID"],
        message: expect.stringContaining("Expected string"),
      });
    }
  });
});
