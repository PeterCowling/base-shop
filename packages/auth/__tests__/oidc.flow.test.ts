import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { OidcConfig } from "../src/oidc/config";

type OidcClientMock = {
  authorizationUrl?: (...args: unknown[]) => string;
  callback?: (...args: unknown[]) => Promise<unknown>;
  endSessionUrl?: (...args: unknown[]) => string;
};

// Use globalThis to avoid Jest mock hoisting issues
declare global {
  var __oidcFlowTestRecords: Map<string, any> | undefined;
  var __oidcFlowTestStore: any | undefined;
  var __oidcFlowTestGetOidcClient: jest.Mock | undefined;
  var __oidcFlowTestLoadOidcConfig: jest.Mock | undefined;
}

globalThis.__oidcFlowTestRecords = new Map<string, any>();
globalThis.__oidcFlowTestStore = {
  get: jest.fn(async (state: string) => globalThis.__oidcFlowTestRecords?.get(state) ?? null),
  set: jest.fn(async (record: any) => {
    globalThis.__oidcFlowTestRecords?.set(record.state, record);
  }),
  delete: jest.fn(async (state: string) => {
    globalThis.__oidcFlowTestRecords?.delete(state);
  }),
};

globalThis.__oidcFlowTestGetOidcClient = jest.fn() as jest.Mock<Promise<OidcClientMock>, []>;
globalThis.__oidcFlowTestLoadOidcConfig = jest.fn(() => ({
  issuer: "https://auth.example.com/realms/base-shop",
  clientId: "client-id",
  clientSecret: "client-secret",
  redirectOrigin: "https://shop.example.com",
  redirectUri: "https://shop.example.com/auth/callback",
  postLogoutRedirectUri: "https://shop.example.com/",
  enforcePkce: true,
  scope: "openid profile email",
})) as jest.Mock<OidcConfig, []>;

const records = globalThis.__oidcFlowTestRecords;
const store = globalThis.__oidcFlowTestStore;
const getOidcClient = globalThis.__oidcFlowTestGetOidcClient;
const loadOidcConfig = globalThis.__oidcFlowTestLoadOidcConfig;

jest.mock("crypto", () => ({
  randomUUID: () => "flow-id",
}));

jest.mock("openid-client", () => ({
  generators: {
    state: () => "state",
    nonce: () => "nonce",
    codeVerifier: () => "verifier",
    codeChallenge: () => "challenge",
  },
}));

jest.mock("../src/oidc/client", () => ({
  get getOidcClient() {
    return globalThis.__oidcFlowTestGetOidcClient;
  },
}));

jest.mock("../src/oidc/config", () => ({
  get loadOidcConfig() {
    return globalThis.__oidcFlowTestLoadOidcConfig;
  },
}));

jest.mock("../src/oidc/flowStore", () => ({
  createOidcAuthFlowStore: async () => globalThis.__oidcFlowTestStore,
}));

let beginOidcLogin: typeof import("../src/oidc").beginOidcLogin;
let buildOidcLogoutUrl: typeof import("../src/oidc").buildOidcLogoutUrl;
let completeOidcLogin: typeof import("../src/oidc").completeOidcLogin;

beforeAll(async () => {
  const oidc = await import("../src/oidc");
  beginOidcLogin = oidc.beginOidcLogin;
  buildOidcLogoutUrl = oidc.buildOidcLogoutUrl;
  completeOidcLogin = oidc.completeOidcLogin;
});

describe("OIDC login flow", () => {
  beforeEach(() => {
    records.clear();
    store.get.mockClear();
    store.set.mockClear();
    store.delete.mockClear();
    getOidcClient.mockReset();
    loadOidcConfig.mockClear();
  });

  it("creates an auth flow and returns an authorization URL", async () => {
    const authUrl = "https://auth.example.com/authorize";
    const client = {
      authorizationUrl: jest.fn(() => authUrl),
    };
    getOidcClient.mockResolvedValue(client);

    const result = await beginOidcLogin({ returnTo: "/checkout" });
    expect(result.authorizationUrl).toBe(authUrl);
    expect(result.flowId).toBe("flow-id");
    expect(client.authorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        state: "state",
        nonce: "nonce",
        code_challenge: "challenge",
        code_challenge_method: "S256",
      }),
    );
    expect(store.set).toHaveBeenCalledWith(
      expect.objectContaining({
        state: "state",
        returnTo: "/checkout",
        flowId: "flow-id",
      }),
    );
  });

  it("completes the OIDC flow and returns the profile", async () => {
    records.set("state", {
      state: "state",
      nonce: "nonce",
      codeVerifier: "verifier",
      redirectUri: "https://shop.example.com/auth/callback",
      returnTo: "/account",
      flowId: "flow-id",
      createdAt: new Date(),
    });
    const tokenSet = {
      claims: () => ({
        iss: "https://auth.example.com/realms/base-shop",
        sub: "user-123",
        email: "user@example.com",
        email_verified: true,
        name: "User Name",
      }),
    };
    const client = {
      callback: jest.fn(async () => tokenSet),
    };
    getOidcClient.mockResolvedValue(client);

    const result = await completeOidcLogin({
      state: "state",
      code: "code",
      flowId: "flow-id",
    });

    expect(result.profile).toMatchObject({
      issuer: "https://auth.example.com/realms/base-shop",
      subject: "user-123",
      email: "user@example.com",
      emailVerified: true,
      name: "User Name",
    });
    expect(result.returnTo).toBe("/account");
    expect(store.delete).toHaveBeenCalledWith("state");
    expect(client.callback).toHaveBeenCalledWith(
      "https://shop.example.com/auth/callback",
      { state: "state", code: "code" },
      expect.objectContaining({ code_verifier: "verifier" }),
    );
  });

  it("rejects mismatched flow ids", async () => {
    records.set("state", {
      state: "state",
      nonce: "nonce",
      codeVerifier: "verifier",
      redirectUri: "https://shop.example.com/auth/callback",
      returnTo: "/account",
      flowId: "flow-id",
      createdAt: new Date(),
    });
    getOidcClient.mockResolvedValue({ callback: jest.fn() });

    await expect(
      completeOidcLogin({ state: "state", code: "code", flowId: "other" }),
    ).rejects.toThrow("OIDC flow does not match this session");
  });

  it("omits PKCE parameters when disabled", async () => {
    loadOidcConfig.mockReturnValueOnce({
      issuer: "https://auth.example.com/realms/base-shop",
      clientId: "client-id",
      clientSecret: "client-secret",
      redirectOrigin: "https://shop.example.com",
      redirectUri: "https://shop.example.com/auth/callback",
      postLogoutRedirectUri: "https://shop.example.com/",
      enforcePkce: false,
      scope: "openid profile email",
    });
    const client = {
      authorizationUrl: jest.fn(() => "https://auth.example.com/authorize"),
    };
    getOidcClient.mockResolvedValue(client);

    await beginOidcLogin({ returnTo: "/" });
    expect(client.authorizationUrl).toHaveBeenCalledWith(
      expect.not.objectContaining({
        code_challenge: "challenge",
      }),
    );
  });
});

describe("OIDC logout", () => {
  it("returns null when end session URL is unavailable", async () => {
    getOidcClient.mockResolvedValue({});
    await expect(buildOidcLogoutUrl()).resolves.toBeNull();
  });

  it("builds a logout URL when supported", async () => {
    const client = {
      endSessionUrl: jest.fn(() => "https://auth.example.com/logout"),
    };
    getOidcClient.mockResolvedValue(client);

    await expect(buildOidcLogoutUrl()).resolves.toBe(
      "https://auth.example.com/logout",
    );
  });
});
