import { describe, expect, it, jest } from "@jest/globals";

import { getOidcClient } from "../src/oidc/client";

// Use globalThis to avoid Jest mock hoisting issues
declare global {
  var __oidcClientTestDiscover: jest.Mock | undefined;
}
globalThis.__oidcClientTestDiscover = jest.fn(async () => ({
  Client: function Client(this: any, config: any) {
    this.config = config;
  },
}));

const discover = globalThis.__oidcClientTestDiscover!;

jest.mock("openid-client", () => ({
  Issuer: {
    get discover() {
      return globalThis.__oidcClientTestDiscover;
    },
  },
}));

jest.mock("../src/oidc/config", () => ({
  loadOidcConfig: () => ({
    issuer: "https://auth.example.com/realms/base-shop",
    clientId: "client-id",
    clientSecret: "client-secret",
    redirectOrigin: "https://shop.example.com",
    redirectUri: "https://shop.example.com/auth/callback",
    postLogoutRedirectUri: "https://shop.example.com/",
    enforcePkce: true,
    scope: "openid profile email",
  }),
}));

describe("getOidcClient", () => {
  it("discovers issuer once and caches the client", async () => {
    const first = await getOidcClient();
    const second = await getOidcClient();
    expect(first).toBe(second);
    expect(discover).toHaveBeenCalledTimes(1);
    expect(first.config).toMatchObject({
      client_id: "client-id",
      client_secret: "client-secret",
      redirect_uris: ["https://shop.example.com/auth/callback"],
      response_types: ["code"],
    });
  });
});
