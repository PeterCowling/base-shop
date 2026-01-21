import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { webcrypto } from "node:crypto";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_MAX_AGE,
  clearAdminCookie,
  hasAdminSession,
  issueAdminSession,
  setAdminCookie,
  validateAdminToken,
} from "../accessAdmin";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_CRYPTO = globalThis.crypto;

beforeEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    value: ORIGINAL_CRYPTO,
    configurable: true,
  });
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value;
  }
});

describe("accessAdmin helpers", () => {
  it("validates admin tokens using environment secret", async () => {
    process.env.XA_ACCESS_ADMIN_TOKEN = "";
    expect(await validateAdminToken("token")).toBe(false);

    process.env.XA_ACCESS_ADMIN_TOKEN = "token";
    expect(await validateAdminToken("token")).toBe(true);
    expect(await validateAdminToken("wrong")).toBe(false);
  });

  it("issues and validates admin sessions via cookies", async () => {
    process.env.XA_ACCESS_COOKIE_SECRET = "secret";
    const token = await issueAdminSession("secret");

    const request = new Request("https://example.com", {
      headers: { cookie: `xa_access_admin=${token}` },
    });
    expect(await hasAdminSession(request)).toBe(true);

    const missing = new Request("https://example.com");
    expect(await hasAdminSession(missing)).toBe(false);
  });

  it("sets and clears admin cookies", () => {
    const response = new NextResponse(null);
    setAdminCookie(response, "token");
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("xa_access_admin=token");
    expect(setCookie).toContain(`Max-Age=${ADMIN_SESSION_MAX_AGE}`);

    clearAdminCookie(response);
    const cleared = response.headers.get("set-cookie") ?? "";
    expect(cleared).toContain("xa_access_admin=");
    expect(cleared).toContain("Max-Age=0");
  });
});
