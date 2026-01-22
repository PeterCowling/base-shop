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
