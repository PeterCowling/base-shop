/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  expectInvalidProd,
  getProdAuthEnv,
  JWT_SECRET,
  OAUTH_SECRET,
} from "./authTestHelpers";

const setFixedTime = () => {
  jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
};

describe("auth providers and token configuration", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("parses local provider without extra secrets", async () => {
    setFixedTime();
    const authEnv = await getProdAuthEnv({ AUTH_PROVIDER: "local" });
    expect(authEnv.AUTH_PROVIDER).toBe("local");
    expect(authEnv.JWT_SECRET).toBeUndefined();
    expect(authEnv.OAUTH_CLIENT_ID).toBeUndefined();
    expect(authEnv.OAUTH_CLIENT_SECRET).toBeUndefined();
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe("2020-01-01T00:15:00.000Z");
    expect(authEnv.TOKEN_ALGORITHM).toBe("HS256");
    expect(authEnv.TOKEN_AUDIENCE).toBe("base-shop");
    expect(authEnv.TOKEN_ISSUER).toBe("base-shop");
    expect(authEnv.ALLOW_GUEST).toBe(false);
    expect(authEnv.ENFORCE_2FA).toBe(false);
  });

  it("parses jwt provider when secret present", async () => {
    const authEnv = await getProdAuthEnv({ AUTH_PROVIDER: "jwt", JWT_SECRET });
    expect(authEnv.JWT_SECRET).toBe(JWT_SECRET);
  });

  it("throws when JWT_SECRET missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "jwt", JWT_SECRET: undefined },
      (env) => env.JWT_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when JWT_SECRET empty", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "jwt", JWT_SECRET: "" },
      (env) => env.JWT_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("parses oauth provider with credentials", async () => {
    const authEnv = await getProdAuthEnv({
      AUTH_PROVIDER: "oauth",
      OAUTH_CLIENT_ID: "client-id",
      OAUTH_CLIENT_SECRET: OAUTH_SECRET,
    });
    expect(authEnv.OAUTH_CLIENT_ID).toBe("client-id");
    expect(authEnv.OAUTH_CLIENT_SECRET).toBe(OAUTH_SECRET);
  });

  it("throws when oauth credentials are missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ AUTH_PROVIDER: "oauth" }, (env) => env.OAUTH_CLIENT_ID, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_ID: { _errors: expect.arrayContaining([expect.any(String)]) },
        OAUTH_CLIENT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when OAUTH_CLIENT_ID missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_SECRET: OAUTH_SECRET, OAUTH_CLIENT_ID: undefined },
      (env) => env.OAUTH_CLIENT_ID,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_ID: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when OAUTH_CLIENT_SECRET missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_ID: "client-id", OAUTH_CLIENT_SECRET: undefined },
      (env) => env.OAUTH_CLIENT_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when OAUTH_CLIENT_ID empty", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_ID: "", OAUTH_CLIENT_SECRET: OAUTH_SECRET },
      (env) => env.OAUTH_CLIENT_ID,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_ID: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when OAUTH_CLIENT_SECRET empty", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_ID: "client-id", OAUTH_CLIENT_SECRET: "" },
      (env) => env.OAUTH_CLIENT_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("normalizes AUTH_TOKEN_TTL minute strings", async () => {
    setFixedTime();
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "15m" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe("2020-01-01T00:15:00.000Z");
  });

  it("parses TTL in seconds", async () => {
    setFixedTime();
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "60s" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(60);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe("2020-01-01T00:01:00.000Z");
  });

  it("normalizes numeric AUTH_TOKEN_TTL without unit", async () => {
    setFixedTime();
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "60" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(60);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe("2020-01-01T00:01:00.000Z");
  });

  it("normalizes AUTH_TOKEN_TTL with whitespace and unit", async () => {
    setFixedTime();
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: " 5 m " });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(300);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe("2020-01-01T00:05:00.000Z");
  });

  it("defaults AUTH_TOKEN_TTL when blank", async () => {
    setFixedTime();
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "   " });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe("2020-01-01T00:15:00.000Z");
  });

  it("allows zero-second TTL", async () => {
    setFixedTime();
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "0s" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(0);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe("2020-01-01T00:00:00.000Z");
  });

  it("errors on malformed TTL string", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ AUTH_TOKEN_TTL: "abc" }, (env) => env.AUTH_TOKEN_TTL, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        AUTH_TOKEN_TTL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("errors on negative TTL input", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ AUTH_TOKEN_TTL: "-5s" }, (env) => env.AUTH_TOKEN_TTL, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        AUTH_TOKEN_TTL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("allows HS256 algorithm", async () => {
    const authEnv = await getProdAuthEnv({ TOKEN_ALGORITHM: "HS256" });
    expect(authEnv.TOKEN_ALGORITHM).toBe("HS256");
  });

  it("allows RS256 algorithm", async () => {
    const authEnv = await getProdAuthEnv({ TOKEN_ALGORITHM: "RS256" });
    expect(authEnv.TOKEN_ALGORITHM).toBe("RS256");
  });

  it("errors on unsupported algorithm", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ TOKEN_ALGORITHM: "none" }, (env) => env.TOKEN_ALGORITHM, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        TOKEN_ALGORITHM: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("uses default token audience and issuer", async () => {
    const authEnv = await getProdAuthEnv();
    expect(authEnv.TOKEN_AUDIENCE).toBe("base-shop");
    expect(authEnv.TOKEN_ISSUER).toBe("base-shop");
  });

  it("overrides token audience and issuer", async () => {
    const authEnv = await getProdAuthEnv({ TOKEN_AUDIENCE: "custom-aud", TOKEN_ISSUER: "custom-iss" });
    expect(authEnv.TOKEN_AUDIENCE).toBe("custom-aud");
    expect(authEnv.TOKEN_ISSUER).toBe("custom-iss");
  });

  it("parses boolean toggles", async () => {
    const authEnv = await getProdAuthEnv({ ALLOW_GUEST: "true", ENFORCE_2FA: "true" });
    expect(authEnv.ALLOW_GUEST).toBe(true);
    expect(authEnv.ENFORCE_2FA).toBe(true);
  });

  it("uses memory session store without redis config", async () => {
    const authEnv = await getProdAuthEnv({ SESSION_STORE: "memory" });
    expect(authEnv.SESSION_STORE).toBe("memory");
  });

});
