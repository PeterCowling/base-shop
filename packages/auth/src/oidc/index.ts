import "server-only";
import { randomUUID } from "crypto";
import { generators, type TokenSet } from "openid-client";
import { getOidcClient } from "./client";
import { loadOidcConfig } from "./config";
import { createOidcAuthFlowStore, type OidcAuthFlowRecord } from "./flowStore";

export type OidcProfile = {
  issuer: string;
  subject: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
};

export type OidcLoginStart = {
  authorizationUrl: string;
  flowId: string;
};

export type OidcLoginResult = {
  profile: OidcProfile;
  tokenSet: TokenSet;
  returnTo: string;
};

const flowStorePromise = createOidcAuthFlowStore();

export async function beginOidcLogin(params: {
  returnTo: string;
}): Promise<OidcLoginStart> {
  const config = loadOidcConfig();
  const client = await getOidcClient();
  const state = generators.state();
  const nonce = generators.nonce();
  const codeVerifier = generators.codeVerifier();
  const flowId = randomUUID();
  const codeChallenge = config.enforcePkce
    ? generators.codeChallenge(codeVerifier)
    : undefined;

  const flow: OidcAuthFlowRecord = {
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

export async function completeOidcLogin(params: {
  state: string;
  code: string;
  flowId: string;
}): Promise<OidcLoginResult> {
  const store = await flowStorePromise;
  const flow = await store.get(params.state);
  if (!flow) {
    throw new Error("OIDC flow not found or expired"); // i18n-exempt: internal auth error
  }
  if (flow.flowId !== params.flowId) {
    throw new Error("OIDC flow does not match this session"); // i18n-exempt: internal auth error
  }

  const client = await getOidcClient();
  let tokenSet: TokenSet;
  try {
    tokenSet = await client.callback(
      flow.redirectUri,
      { state: params.state, code: params.code },
      {
        state: params.state,
        nonce: flow.nonce,
        code_verifier: flow.codeVerifier,
      },
    );
  } finally {
    await store.delete(params.state);
  }

  const claims = tokenSet.claims();
  if (!claims.sub || typeof claims.sub !== "string") {
    throw new Error("OIDC token is missing subject"); // i18n-exempt: internal auth error
  }
  if (!claims.iss || typeof claims.iss !== "string") {
    throw new Error("OIDC token is missing issuer"); // i18n-exempt: internal auth error
  }

  const profile: OidcProfile = {
    issuer: claims.iss,
    subject: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    emailVerified:
      typeof claims.email_verified === "boolean" ? claims.email_verified : undefined,
    name:
      typeof claims.name === "string"
        ? claims.name
        : typeof claims.preferred_username === "string"
          ? claims.preferred_username
          : undefined,
  };

  return { profile, tokenSet, returnTo: flow.returnTo };
}

export async function buildOidcLogoutUrl(params: {
  idTokenHint?: string;
} = {}): Promise<string | null> {
  const client = await getOidcClient();
  const config = loadOidcConfig();
  if (typeof client.endSessionUrl !== "function") {
    return null;
  }
  return client.endSessionUrl({
    post_logout_redirect_uri: config.postLogoutRedirectUri,
    id_token_hint: params.idTokenHint,
  });
}
