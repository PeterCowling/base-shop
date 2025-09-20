/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { NEXT_SECRET, SESSION_SECRET } from "../authEnvTestUtils.ts";

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

describe("core env module defaults in development", () => {
  it("uses default CART_COOKIE_SECRET in development when omitted", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "development",
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET: SESSION_SECRET,
    } as NodeJS.ProcessEnv;
    delete process.env.CART_COOKIE_SECRET;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    const { coreEnv } = require("../../core.ts");
    expect(coreEnv.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

