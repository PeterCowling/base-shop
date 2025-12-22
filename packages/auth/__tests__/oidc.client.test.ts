import { describe, expect, it, jest } from "@jest/globals";

const discover = jest.fn(async () => ({
  Client: function Client(this: any, config: any) {
    this.config = config;
  },
}));

jest.mock("openid-client", () => ({
  Issuer: { discover },
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

import { getOidcClient } from "../src/oidc/client";

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
