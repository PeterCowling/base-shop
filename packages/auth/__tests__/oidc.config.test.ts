import { describe, expect, it } from "@jest/globals";

import { loadKeycloakConfig } from "../src/keycloak/config";
import { loadOidcConfig } from "../src/oidc/config";

jest.mock("@acme/config/env/auth", () => ({
  authEnv: {
    OAUTH_ISSUER: "https://auth.example.com/realms/base-shop",
    OAUTH_CLIENT_ID: "client-id",
    OAUTH_CLIENT_SECRET: "client-secret",
    OAUTH_REDIRECT_ORIGIN: "https://shop.example.com",
    OAUTH_ENFORCE_PKCE: false,
  },
}));

describe("OIDC config", () => {
  it("builds redirect URIs and respects PKCE settings", () => {
    const config = loadOidcConfig();
    expect(config.issuer).toBe("https://auth.example.com/realms/base-shop");
    expect(config.redirectUri).toBe("https://shop.example.com/auth/callback");
    expect(config.postLogoutRedirectUri).toBe("https://shop.example.com/");
    expect(config.enforcePkce).toBe(false);
  });

  it("exposes Keycloak config via OIDC config", () => {
    const config = loadKeycloakConfig();
    expect(config.clientId).toBe("client-id");
    expect(config.clientSecret).toBe("client-secret");
  });
});
