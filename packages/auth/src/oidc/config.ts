import "server-only";
import { authEnv } from "@acme/config/env/auth";

export type OidcConfig = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectOrigin: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  enforcePkce: boolean;
  scope: string;
};

const DEFAULT_SCOPE = "openid profile email";

export function loadOidcConfig(): OidcConfig {
  const {
    OAUTH_ISSUER,
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REDIRECT_ORIGIN,
    OAUTH_ENFORCE_PKCE,
  } = authEnv;
  if (!OAUTH_ISSUER || !OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET || !OAUTH_REDIRECT_ORIGIN) {
    throw new Error(
      "OIDC configuration is incomplete; check OAUTH_ISSUER, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, and OAUTH_REDIRECT_ORIGIN", // i18n-exempt: developer-only config error
    );
  }
  const redirectUri = new URL("/auth/callback", OAUTH_REDIRECT_ORIGIN).toString();
  const postLogoutRedirectUri = new URL("/", OAUTH_REDIRECT_ORIGIN).toString();

  return {
    issuer: OAUTH_ISSUER,
    clientId: OAUTH_CLIENT_ID,
    clientSecret: OAUTH_CLIENT_SECRET,
    redirectOrigin: OAUTH_REDIRECT_ORIGIN,
    redirectUri,
    postLogoutRedirectUri,
    enforcePkce: OAUTH_ENFORCE_PKCE ?? true,
    scope: DEFAULT_SCOPE,
  };
}
