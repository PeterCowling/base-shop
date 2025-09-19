/** @jest-environment node */
import { describe, expect, it, jest } from "@jest/globals";

import {
  baseCoreEnv,
  loadCoreEnvWith,
  parseWithCoreSchema,
  parseWithDepositSchema,
} from "./core.test-helpers.ts";

describe("core env typed helpers", () => {
  it("retrieves string, number, and boolean variables", () => {
    const parsed = parseWithCoreSchema({
      OUTPUT_EXPORT: "true",
      CART_TTL: "99",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.OUTPUT_EXPORT).toBe(true);
      expect(parsed.data.CART_TTL).toBe(99);
      expect(parsed.data.CMS_SPACE_URL).toBe(baseCoreEnv.CMS_SPACE_URL);
    }
  });

  it("falls back to defaults when variables are missing", () => {
    const parsed = parseWithDepositSchema();
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    }
  });

  it("reports errors for absent or malformed variables", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnvWith({
        CMS_SPACE_URL: "",
        CMS_ACCESS_TOKEN: "",
        SANITY_API_VERSION: "v1",
        OUTPUT_EXPORT: "notbool",
        CART_TTL: "abc",
      }),
    ).toThrow("Invalid core environment variables");
    errorSpy.mockRestore();
  });

  it("coerces booleans and validates numbers", () => {
    const boolParsed = parseWithCoreSchema({ OUTPUT_EXPORT: "" });
    expect(boolParsed.success).toBe(true);
    if (boolParsed.success) {
      expect(boolParsed.data.OUTPUT_EXPORT).toBe(false);
    }

    const numParsed = parseWithCoreSchema({ CART_TTL: "" });
    expect(numParsed.success).toBe(true);
    if (numParsed.success) {
      expect(numParsed.data.CART_TTL).toBe(0);
    }
  });
});
