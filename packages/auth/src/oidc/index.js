"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beginOidcLogin = beginOidcLogin;
exports.completeOidcLogin = completeOidcLogin;
exports.buildOidcLogoutUrl = buildOidcLogoutUrl;
require("server-only");
const crypto_1 = require("crypto");
const openid_client_1 = require("openid-client");
const client_1 = require("./client");
const config_1 = require("./config");
const flowStore_1 = require("./flowStore");
const flowStorePromise = (0, flowStore_1.createOidcAuthFlowStore)();
async function beginOidcLogin(params) {
    const config = (0, config_1.loadOidcConfig)();
    const client = await (0, client_1.getOidcClient)();
    const state = openid_client_1.generators.state();
    const nonce = openid_client_1.generators.nonce();
    const codeVerifier = openid_client_1.generators.codeVerifier();
    const flowId = (0, crypto_1.randomUUID)();
    const codeChallenge = config.enforcePkce
        ? openid_client_1.generators.codeChallenge(codeVerifier)
        : undefined;
    const flow = {
        state,
        nonce,
        codeVerifier,
        redirectUri: config.redirectUri,
        returnTo: params.returnTo,
        flowId,
        createdAt: new Date(),
    };
    const store = await flowStorePromise;
    await store.set(flow);
    const authorizationUrl = client.authorizationUrl({
        scope: config.scope,
        response_type: "code",
        response_mode: "query",
        redirect_uri: config.redirectUri,
        state,
        nonce,
        ...(codeChallenge
            ? {
                code_challenge_method: "S256",
                code_challenge: codeChallenge,
            }
            : {}),
    });
    return { authorizationUrl, flowId };
}
async function completeOidcLogin(params) {
    const store = await flowStorePromise;
    const flow = await store.get(params.state);
    if (!flow) {
        throw new Error("OIDC flow not found or expired"); // i18n-exempt: internal auth error
    }
    if (flow.flowId !== params.flowId) {
        throw new Error("OIDC flow does not match this session"); // i18n-exempt: internal auth error
    }
    const client = await (0, client_1.getOidcClient)();
    let tokenSet;
    try {
        tokenSet = await client.callback(flow.redirectUri, { state: params.state, code: params.code }, {
            state: params.state,
            nonce: flow.nonce,
            code_verifier: flow.codeVerifier,
        });
    }
    finally {
        await store.delete(params.state);
    }
    const claims = tokenSet.claims();
    if (!claims.sub || typeof claims.sub !== "string") {
        throw new Error("OIDC token is missing subject"); // i18n-exempt: internal auth error
    }
    if (!claims.iss || typeof claims.iss !== "string") {
        throw new Error("OIDC token is missing issuer"); // i18n-exempt: internal auth error
    }
    const profile = {
        issuer: claims.iss,
        subject: claims.sub,
        email: typeof claims.email === "string" ? claims.email : undefined,
        emailVerified: typeof claims.email_verified === "boolean" ? claims.email_verified : undefined,
        name: typeof claims.name === "string"
            ? claims.name
            : typeof claims.preferred_username === "string"
                ? claims.preferred_username
                : undefined,
    };
    return { profile, tokenSet, returnTo: flow.returnTo };
}
async function buildOidcLogoutUrl(params = {}) {
    const client = await (0, client_1.getOidcClient)();
    const config = (0, config_1.loadOidcConfig)();
    if (typeof client.endSessionUrl !== "function") {
        return null;
    }
    return client.endSessionUrl({
        post_logout_redirect_uri: config.postLogoutRedirectUri,
        id_token_hint: params.idTokenHint,
    });
}
