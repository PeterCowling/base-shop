import { afterEach, describe, expect, it } from "@jest/globals";

import {
  isInviteCodeValid,
  normalizeInviteCode,
  resolveAccessCookieSecret,
  resolveAdminToken,
  resolveInviteCodes,
  resolveInviteHashSecret,
} from "../stealth";

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value;
  }
}

afterEach(() => {
  restoreEnv();
});

describe("stealth helpers", () => {
  it("normalizes invite codes and validates membership", () => {
    const normalized = normalizeInviteCode(" AbC-123 ");
    expect(normalized).toBe("abc123");
    expect(isInviteCodeValid("abc123", ["abc123"])).toBe(true);
    expect(isInviteCodeValid("abc123", [])).toBe(false);
  });

  it("resolves invite codes from environment", () => {
    process.env.XA_STEALTH_INVITE_CODES = "abc, DEF-123";
    expect(resolveInviteCodes()).toEqual(["abc", "def123"]);
  });

  it("resolves access secrets with correct precedence", () => {
    delete process.env.XA_ACCESS_COOKIE_SECRET;
    process.env.SESSION_SECRET = "session";
    process.env.NEXTAUTH_SECRET = "nextauth";
    expect(resolveAccessCookieSecret()).toBe("session");

    process.env.XA_ACCESS_COOKIE_SECRET = "xa";
    expect(resolveAccessCookieSecret()).toBe("xa");
  });

  it("resolves invite hash secret and admin token", () => {
    process.env.XA_INVITE_HASH_SECRET = "hash-secret";
    process.env.XA_ACCESS_ADMIN_TOKEN = " admin ";
    expect(resolveInviteHashSecret()).toBe("hash-secret");
    expect(resolveAdminToken()).toBe("admin");
  });
});
