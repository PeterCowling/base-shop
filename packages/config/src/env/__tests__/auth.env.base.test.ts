/** @jest-environment node */
import { describe, expect, it, jest } from "@jest/globals";

import {
  devEnv,
  devSecrets,
  expectInvalidAuthEnv,
  expectInvalidProd,
  loadAuthModule,
  loadProd,
  prodEnv,
  prodSecrets,
  testEnv,
} from "./authTestHelpers";

 
type AnySpyInstance = { mockRestore: () => void } & Record<string, any>;

const expectSecretsError = (
  errorSpy: AnySpyInstance,
  keys: string[],
) => {
  expect(errorSpy).toHaveBeenCalledWith(
    "❌ Invalid auth environment variables:",
    expect.objectContaining(
      keys.reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = { _errors: expect.arrayContaining([expect.any(String)]) };
        return acc;
      }, {}),
    ),
  );
};

describe("auth env base configuration", () => {
  it("parses valid production configuration", async () => {
    const { authEnv } = await loadAuthModule(prodEnv());
    expect(authEnv).toMatchObject(prodSecrets);
  });

  it("defaults secrets in development", async () => {
    const { authEnv } = await loadAuthModule(
      devEnv({ NEXTAUTH_SECRET: undefined, SESSION_SECRET: undefined, PREVIEW_TOKEN_SECRET: undefined }),
    );
    expect(authEnv).toMatchObject(devSecrets);
    expect(authEnv.PREVIEW_TOKEN_SECRET).toBeUndefined();
  });

  it("defaults NEXTAUTH_SECRET in development when missing", async () => {
    const { authEnv } = await loadAuthModule(
      devEnv({ NEXTAUTH_SECRET: undefined, SESSION_SECRET: prodSecrets.SESSION_SECRET }),
    );
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: devSecrets.NEXTAUTH_SECRET,
      SESSION_SECRET: prodSecrets.SESSION_SECRET,
    });
  });

  it("defaults SESSION_SECRET in development when missing", async () => {
    const { authEnv } = await loadAuthModule(
      devEnv({ NEXTAUTH_SECRET: prodSecrets.NEXTAUTH_SECRET, SESSION_SECRET: undefined }),
    );
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: prodSecrets.NEXTAUTH_SECRET,
      SESSION_SECRET: devSecrets.SESSION_SECRET,
    });
  });

  it("throws when secrets are empty in non-production", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidAuthEnv(testEnv({ NEXTAUTH_SECRET: "", SESSION_SECRET: "" }), (env) => env.NEXTAUTH_SECRET, errorSpy);
    expectSecretsError(errorSpy, ["NEXTAUTH_SECRET", "SESSION_SECRET"]);
    errorSpy.mockRestore();
  });

  it("throws on missing required production configuration", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { NEXTAUTH_SECRET: undefined, SESSION_SECRET: undefined },
      (env) => env.NEXTAUTH_SECRET,
      errorSpy,
    );
    expectSecretsError(errorSpy, ["NEXTAUTH_SECRET", "SESSION_SECRET"]);
    errorSpy.mockRestore();
  });

  it("throws when NEXTAUTH_SECRET is missing in production", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ NEXTAUTH_SECRET: undefined }, (env) => env.NEXTAUTH_SECRET, errorSpy);
    expectSecretsError(errorSpy, ["NEXTAUTH_SECRET"]);
    errorSpy.mockRestore();
  });

  it("throws when SESSION_SECRET is missing in production", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ SESSION_SECRET: undefined }, (env) => env.SESSION_SECRET, errorSpy);
    expectSecretsError(errorSpy, ["SESSION_SECRET"]);
    errorSpy.mockRestore();
  });

  it("throws when required secrets are empty", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ NEXTAUTH_SECRET: "", SESSION_SECRET: "" }, (env) => env.NEXTAUTH_SECRET, errorSpy);
    expectSecretsError(errorSpy, ["NEXTAUTH_SECRET", "SESSION_SECRET"]);
    errorSpy.mockRestore();
  });

  it("fails safeParse for missing required secrets", async () => {
    const { authEnvSchema } = await loadProd();
    const result = authEnvSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      NEXTAUTH_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      SESSION_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
    });
    expect(() => authEnvSchema.parse({})).toThrow();
  });

  it("throws when SESSION_STORE is invalid", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ SESSION_STORE: "postgres" }, (env) => env.SESSION_STORE, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        SESSION_STORE: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });
});
