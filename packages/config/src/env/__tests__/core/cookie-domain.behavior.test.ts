/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { loadCoreEnv } from "../../core.ts";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("COOKIE_DOMAIN handling", () => {
  it("includes domain when set", () => {
    const env = loadCoreEnv({
      COOKIE_DOMAIN: "shop.example.com",
      EMAIL_FROM: "from@example.com",
      EMAIL_PROVIDER: "smtp",
    } as unknown as NodeJS.ProcessEnv);
    expect(env.COOKIE_DOMAIN).toBe("shop.example.com");
  });

  it("omits domain when unset", () => {
    const env = loadCoreEnv({} as NodeJS.ProcessEnv);
    expect(env.COOKIE_DOMAIN).toBeUndefined();
  });
});

