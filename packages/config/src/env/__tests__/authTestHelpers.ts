import { expectInvalidAuthEnvWithConfigEnv as expectInvalidAuth } from "../../../test/utils/expectInvalidAuthEnv";
import { withEnv } from "../../../test/utils/withEnv";
import {
  DEV_NEXTAUTH_SECRET,
  DEV_SESSION_SECRET,
  NEXT_SECRET,
  SESSION_SECRET,
} from "./authEnvTestUtils";

export const STRONG_TOKEN = "token-value-32-chars-long-string!!";
export const JWT_SECRET = "jwt-secret-32-chars-long-string!!!";
export const OAUTH_SECRET = "oauth-secret-32-chars-long-string!!";
export const OAUTH_ISSUER = "https://auth.example.com/realms/base-shop";
export const OAUTH_REDIRECT_ORIGIN = "https://shop.example.com";

export type EnvOverrides = Record<string, string | undefined>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Jest SpyInstance types vary between @jest/globals and @types/jest
type AnySpyInstance = { mockRestore: () => void } & Record<string, any>;

const baseProdEnv: EnvOverrides = {
  NODE_ENV: "production",
  NEXTAUTH_SECRET: NEXT_SECRET,
  SESSION_SECRET,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
};

const baseDevEnv: EnvOverrides = {
  NODE_ENV: "development",
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
};

const baseTestEnv: EnvOverrides = {
  NODE_ENV: "test",
};

export const prodEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  ...baseProdEnv,
  ...overrides,
});

export const devEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  ...baseDevEnv,
  ...overrides,
});

export const testEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  ...baseTestEnv,
  ...overrides,
});

export const loadAuthModule = (env: EnvOverrides) => withEnv(env, () => import("../auth.ts"));

export const expectInvalidAuthEnv = async (
  env: EnvOverrides,
  accessor: (env: Record<string, unknown>) => unknown,
  consoleErrorSpy?: AnySpyInstance,
) =>
  expectInvalidAuth({
    env,
    accessor: (auth) => accessor(auth.authEnv as Record<string, unknown>),
    consoleErrorSpy,
  });

export const loadProd = (overrides: EnvOverrides = {}) => loadAuthModule(prodEnv(overrides));

export const expectInvalidProd = (
  overrides: EnvOverrides,
  accessor: (env: Record<string, unknown>) => unknown,
  consoleErrorSpy?: AnySpyInstance,
) => expectInvalidAuthEnv(prodEnv(overrides), accessor, consoleErrorSpy);

export const getProdAuthEnv = async (overrides: EnvOverrides = {}) => (await loadProd(overrides)).authEnv;

export const loadProdSchema = async () => (await loadProd()).authEnvSchema;

export const loadAuthSchema = async (env: EnvOverrides) => (await loadAuthModule(env)).authEnvSchema;

export const devSecrets = {
  NEXTAUTH_SECRET: DEV_NEXTAUTH_SECRET,
  SESSION_SECRET: DEV_SESSION_SECRET,
};

export const prodSecrets = {
  NEXTAUTH_SECRET: NEXT_SECRET,
  SESSION_SECRET,
};
