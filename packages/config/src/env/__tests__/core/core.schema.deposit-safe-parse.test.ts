/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";

import {
  parseWithCoreSchema,
  parseWithDepositSchema,
} from "./core.test-helpers.ts";

describe("core env deposit release schema", () => {
  it("accepts valid custom prefixed variables", () => {
    const parsed = parseWithDepositSchema({
      DEPOSIT_RELEASE_CUSTOM_ENABLED: "true",
      DEPOSIT_RELEASE_CUSTOM_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_EXTRA_ENABLED: "false",
      REVERSE_LOGISTICS_EXTRA_INTERVAL_MS: "2000",
      LATE_FEE_SPECIAL_ENABLED: "true",
      LATE_FEE_SPECIAL_INTERVAL_MS: "3000",
    });
    expect(parsed.success).toBe(true);
  });

  it("reports invalid custom prefixed variables", () => {
    const parsed = parseWithDepositSchema({
      DEPOSIT_RELEASE_BAD_ENABLED: "maybe",
      REVERSE_LOGISTICS_BAD_INTERVAL_MS: "soon",
      LATE_FEE_BAD_ENABLED: "nope",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_BAD_ENABLED"],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: ["REVERSE_LOGISTICS_BAD_INTERVAL_MS"],
            message: "must be a number",
          }),
          expect.objectContaining({
            path: ["LATE_FEE_BAD_ENABLED"],
            message: "must be true or false",
          }),
        ]),
      );
    }
  });

  it("reports custom issue for invalid ENABLED variable", () => {
    const parsed = parseWithCoreSchema({
      DEPOSIT_RELEASE_FOO_ENABLED: "notbool",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_FOO_ENABLED"],
            message: "must be true or false",
          }),
        ]),
      );
    }
  });

  it("reports custom issue for invalid INTERVAL_MS variable", () => {
    const parsed = parseWithCoreSchema({
      REVERSE_LOGISTICS_BAR_INTERVAL_MS: "soon",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["REVERSE_LOGISTICS_BAR_INTERVAL_MS"],
            message: "must be a number",
          }),
        ]),
      );
    }
  });

  it("reports invalid DEPOSIT_RELEASE_ENABLED", () => {
    const parsed = parseWithDepositSchema({
      DEPOSIT_RELEASE_ENABLED: "yes",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["DEPOSIT_RELEASE_ENABLED"],
        message: "must be true or false",
      });
    }
  });

  it("reports non-numeric LATE_FEE_INTERVAL_MS", () => {
    const parsed = parseWithDepositSchema({
      LATE_FEE_INTERVAL_MS: "fast",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["LATE_FEE_INTERVAL_MS"],
        message: "must be a number",
      });
    }
  });

  it("flags invalid values and accepts valid ones via coreEnvSchema", () => {
    const invalid = parseWithCoreSchema({
      DEPOSIT_RELEASE_ENABLED: "maybe",
      LATE_FEE_INTERVAL_MS: "abc",
      REVERSE_LOGISTICS_ENABLED: "true",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "false",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_ENABLED"],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: ["LATE_FEE_INTERVAL_MS"],
            message: "must be a number",
          }),
        ]),
      );
    }

    const valid = parseWithCoreSchema({
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "false",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "3000",
    });
    expect(valid.success).toBe(true);
  });
});
