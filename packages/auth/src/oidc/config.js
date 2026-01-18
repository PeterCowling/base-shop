"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadOidcConfig = loadOidcConfig;
require("server-only");
const auth_1 = require("@acme/config/env/auth");
const DEFAULT_SCOPE = "openid profile email";
function loadOidcConfig() {
    const { OAUTH_ISSUER, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_ORIGIN, OAUTH_ENFORCE_PKCE, } = auth_1.authEnv;
    if (!OAUTH_ISSUER || !OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET || !OAUTH_REDIRECT_ORIGIN) {
        throw new Error("OIDC configuration is incomplete; check OAUTH_ISSUER, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, and OAUTH_REDIRECT_ORIGIN");
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
