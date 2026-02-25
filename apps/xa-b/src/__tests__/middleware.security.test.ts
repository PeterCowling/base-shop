import { Buffer } from "node:buffer";
import { webcrypto } from "node:crypto";

import type { NextRequest } from "next/server";

import { middleware } from "../../middleware";
import { createAccessToken } from "../lib/accessTokens";

const ENV_KEYS = [
  "NODE_ENV",
  "STEALTH_MODE",
  "NEXT_PUBLIC_STEALTH_MODE",
  "XA_STEALTH_MODE",
  "STEALTH_INVITE_CODES",
  "XA_STEALTH_INVITE_CODES",
  "STEALTH_STRICT",
  "XA_STRICT_STEALTH",
  "STEALTH_REQUIRE_CF_ACCESS",
  "XA_REQUIRE_CF_ACCESS",
  "STEALTH_ALLOWED_HOSTS",
  "XA_ALLOWED_HOSTS",
  "XA_GUARD_TOKEN",
  "XA_ACCESS_COOKIE_SECRET",
  "XA_CF_ACCESS_AUDIENCE",
  "XA_CF_ACCESS_ISSUER",
  "XA_CF_ACCESS_ISSUERS",
  "XA_TRUST_FORWARDED_HOST_HEADER",
];
const ORIGINAL_ENV = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  (globalThis as { __xaCfAccessKeyCache?: Map<string, CryptoKey> }).__xaCfAccessKeyCache?.clear();
});

beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
  }

  if (typeof globalThis.btoa !== "function") {
    Object.defineProperty(globalThis, "btoa", {
      value: (value: string) => Buffer.from(value, "binary").toString("base64"),
      configurable: true,
    });
  }

  if (typeof globalThis.atob !== "function") {
    Object.defineProperty(globalThis, "atob", {
      value: (value: string) => Buffer.from(value, "base64").toString("binary"),
      configurable: true,
    });
  }
});

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeBytes(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

let cfAccessKeyPairPromise: Promise<CryptoKeyPair> | null = null;

function resolveCfAccessKeyPair(): Promise<CryptoKeyPair> {
  if (!cfAccessKeyPairPromise) {
    cfAccessKeyPairPromise = crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    ) as Promise<CryptoKeyPair>;
  }
  return cfAccessKeyPairPromise;
}

async function makeCfAccessJwt(options: {
  issuer: string;
  audience: string;
  expiresInSec?: number;
}) {
  const pair = await resolveCfAccessKeyPair();

  const publicJwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey & {
    kid?: string;
    alg?: string;
    use?: string;
  };
  publicJwk.kid = "test-kid";
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT", kid: publicJwk.kid }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: options.issuer,
      aud: options.audience,
      exp: now + (options.expiresInSec ?? 300),
      nbf: now - 5,
    }),
  );
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, data));
  const token = `${header}.${payload}.${base64UrlEncodeBytes(signature)}`;
  return { token, publicJwk };
}

function makeRequest({
  pathname = "/",
  search = "",
  headers = {},
  cookies = {},
}: {
  pathname?: string;
  search?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
} = {}) {
  const url = new URL(`https://example.com${pathname}${search}`);
  (url as { clone?: () => URL }).clone = () => new URL(url.toString());
  return {
    headers: new Headers(headers),
    nextUrl: url,
    cookies: {
      get: (name: string) =>
        cookies[name] ? ({ value: cookies[name] } as { value: string }) : undefined,
    },
  } as NextRequest;
}

it("tightens CSP in production", async () => {
  process.env.NODE_ENV = "production";
  process.env.STEALTH_MODE = "0";
  process.env.XA_STEALTH_MODE = "0";
  process.env.NEXT_PUBLIC_STEALTH_MODE = "0";
  const response = await middleware(makeRequest());
  const csp = response.headers.get("Content-Security-Policy") ?? "";

  expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).not.toContain(" ws:");
  expect(csp).toContain("wss:");
});

it("keeps dev CSP allowances for tooling", async () => {
  process.env.NODE_ENV = "development";
  process.env.STEALTH_MODE = "0";
  process.env.XA_STEALTH_MODE = "0";
  process.env.NEXT_PUBLIC_STEALTH_MODE = "0";
  const response = await middleware(makeRequest());
  const csp = response.headers.get("Content-Security-Policy") ?? "";

  expect(csp).toContain("'unsafe-eval'");
  expect(csp).toContain(" ws:");
});

it("redirects to /access when invite is missing", async () => {
  process.env.STEALTH_MODE = "1";
  process.env.XA_STEALTH_MODE = "1";
  process.env.STEALTH_INVITE_CODES = "cipher";
  process.env.STEALTH_STRICT = "0";
  process.env.STEALTH_REQUIRE_CF_ACCESS = "0";
  process.env.XA_GUARD_TOKEN = "";
  process.env.XA_ACCESS_COOKIE_SECRET = "secret";

  const response = await middleware(makeRequest({ pathname: "/" }));

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toContain("/access");
});

it("allows /access without invite cookie", async () => {
  process.env.STEALTH_MODE = "1";
  process.env.XA_STEALTH_MODE = "1";
  process.env.STEALTH_INVITE_CODES = "cipher";
  process.env.STEALTH_STRICT = "0";
  process.env.STEALTH_REQUIRE_CF_ACCESS = "0";
  process.env.XA_GUARD_TOKEN = "";
  process.env.XA_ACCESS_COOKIE_SECRET = "secret";
  const response = await middleware(makeRequest({ pathname: "/access" }));

  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
});

it("allows valid invite cookie", async () => {
  process.env.STEALTH_MODE = "1";
  process.env.XA_STEALTH_MODE = "1";
  process.env.STEALTH_STRICT = "0";
  process.env.STEALTH_REQUIRE_CF_ACCESS = "0";
  process.env.XA_GUARD_TOKEN = "";
  process.env.XA_ACCESS_COOKIE_SECRET = "secret";
  const token = await createAccessToken(
    {
      kind: "invite",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
    },
    "secret",
  );
  const response = await middleware(
    makeRequest({ pathname: "/", cookies: { xa_access: token } }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
});

it("adds noindex headers when stealth mode is enabled", async () => {
  process.env.STEALTH_MODE = "1";
  process.env.XA_STEALTH_MODE = "1";
  process.env.STEALTH_INVITE_CODES = "cipher";
  process.env.STEALTH_STRICT = "0";
  process.env.STEALTH_REQUIRE_CF_ACCESS = "0";
  process.env.XA_GUARD_TOKEN = "";
  process.env.XA_ACCESS_COOKIE_SECRET = "secret";
  const response = await middleware(makeRequest({ pathname: "/access" }));

  expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  expect(response.headers.get("Cache-Control")).toContain("no-store");
});

it("blocks access when Cloudflare Access is required but jwt assertion is missing", async () => {
  process.env.STEALTH_MODE = "1";
  process.env.XA_STEALTH_MODE = "1";
  process.env.STEALTH_STRICT = "0";
  process.env.STEALTH_REQUIRE_CF_ACCESS = "1";
  process.env.XA_GUARD_TOKEN = "";
  process.env.XA_ACCESS_COOKIE_SECRET = "secret";
  const invite = await createAccessToken(
    {
      kind: "invite",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
    },
    "secret",
  );

  const response = await middleware(
    makeRequest({
      pathname: "/",
      cookies: { xa_access: invite },
    }),
  );

  expect(response.status).toBe(404);
});

it("allows access when Cloudflare Access jwt assertion verifies", async () => {
  process.env.STEALTH_MODE = "1";
  process.env.XA_STEALTH_MODE = "1";
  process.env.STEALTH_STRICT = "0";
  process.env.STEALTH_REQUIRE_CF_ACCESS = "1";
  process.env.XA_GUARD_TOKEN = "";
  process.env.XA_ACCESS_COOKIE_SECRET = "secret";
  process.env.XA_CF_ACCESS_AUDIENCE = "aud-1";

  const issuer = "https://team.cloudflareaccess.com";
  process.env.XA_CF_ACCESS_ISSUER = issuer;
  const { token, publicJwk } = await makeCfAccessJwt({ issuer, audience: "aud-1" });
  const invite = await createAccessToken(
    {
      kind: "invite",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
    },
    "secret",
  );

  const originalFetch = global.fetch;
  global.fetch = jest.fn(async () => {
    const body = JSON.stringify({ keys: [publicJwk] });
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;

  try {
    const response = await middleware(
      makeRequest({
        pathname: "/",
        headers: { "cf-access-jwt-assertion": token },
        cookies: { xa_access: invite },
      }),
    );
    expect(response.status).toBe(200);
  } finally {
    global.fetch = originalFetch;
  }
});

it("blocks access when Cloudflare Access audience is not configured", async () => {
  process.env.STEALTH_MODE = "1";
  process.env.XA_STEALTH_MODE = "1";
  process.env.STEALTH_STRICT = "0";
  process.env.STEALTH_REQUIRE_CF_ACCESS = "1";
  process.env.XA_GUARD_TOKEN = "";
  process.env.XA_ACCESS_COOKIE_SECRET = "secret";

  const issuer = "https://team.cloudflareaccess.com";
  process.env.XA_CF_ACCESS_ISSUER = issuer;
  const { token, publicJwk } = await makeCfAccessJwt({ issuer, audience: "aud-1" });
  const invite = await createAccessToken(
    {
      kind: "invite",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
    },
    "secret",
  );

  const originalFetch = global.fetch;
  global.fetch = jest.fn(async () => {
    const body = JSON.stringify({ keys: [publicJwk] });
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;

  try {
    const response = await middleware(
      makeRequest({
        pathname: "/",
        headers: { "cf-access-jwt-assertion": token },
        cookies: { xa_access: invite },
      }),
    );
    expect(response.status).toBe(404);
  } finally {
    global.fetch = originalFetch;
  }
});

it("blocks access when Cloudflare Access issuer is not allowlisted", async () => {
  process.env.STEALTH_MODE = "1";
  process.env.XA_STEALTH_MODE = "1";
  process.env.STEALTH_STRICT = "0";
  process.env.STEALTH_REQUIRE_CF_ACCESS = "1";
  process.env.XA_GUARD_TOKEN = "";
  process.env.XA_ACCESS_COOKIE_SECRET = "secret";
  process.env.XA_CF_ACCESS_AUDIENCE = "aud-1";
  process.env.XA_CF_ACCESS_ISSUER = "https://trusted.cloudflareaccess.com";

  const issuer = "https://other.cloudflareaccess.com";
  const { token } = await makeCfAccessJwt({ issuer, audience: "aud-1" });
  const invite = await createAccessToken(
    {
      kind: "invite",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
    },
    "secret",
  );

  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;

  try {
    const response = await middleware(
      makeRequest({
        pathname: "/",
        headers: { "cf-access-jwt-assertion": token },
        cookies: { xa_access: invite },
      }),
    );
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    global.fetch = originalFetch;
  }
});
