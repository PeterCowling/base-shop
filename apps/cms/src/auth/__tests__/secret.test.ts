import { afterEach, describe, expect, it, jest } from "@jest/globals";

const OLD_ENV = { ...process.env };

afterEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV };
});

describe("auth secret", () => {
  it("throws when NEXTAUTH_SECRET is missing", () => {
    jest.doMock("@acme/config", () => ({
      env: { ...process.env, NEXTAUTH_SECRET: undefined },
    }));
    expect(() => require("../secret")).toThrow(
      "NEXTAUTH_SECRET is not set",
    );
  });

  it("throws when NEXTAUTH_SECRET is empty", () => {
    jest.doMock("@acme/config", () => ({
      env: { ...process.env, NEXTAUTH_SECRET: "" },
    }));
    expect(() => require("../secret")).toThrow(
      "NEXTAUTH_SECRET is not set",
    );
  });

  it("exports the NEXTAUTH_SECRET value", () => {
    jest.doMock("@acme/config", () => ({
      env: {
        ...process.env,
        NEXTAUTH_SECRET: "test-nextauth-secret-32-chars-long-string!",
      },
    }));
    const { authSecret } = require("../secret");
    expect(authSecret).toBe(
      "test-nextauth-secret-32-chars-long-string!",
    );
  });
});

