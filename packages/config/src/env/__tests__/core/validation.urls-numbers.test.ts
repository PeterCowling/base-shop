/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { loadCoreEnv } from "../../core.ts";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("core url and number validation", () => {
  it("rejects invalid numeric strings for number fields", () => {
    expect(() =>
      loadCoreEnv({ CART_TTL: "abc" } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
  });

  it("rejects invalid NEXT_PUBLIC_BASE_URL values", () => {
    expect(() =>
      loadCoreEnv({ NEXT_PUBLIC_BASE_URL: "not a url" } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
  });
});

