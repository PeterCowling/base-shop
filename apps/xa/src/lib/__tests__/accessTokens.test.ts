import { webcrypto } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { createAccessToken, verifyAccessToken } from "../accessTokens";

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
  jest.useRealTimers();
});

describe("accessTokens", () => {
  it("creates and verifies access tokens", async () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = { kind: "invite" as const, exp: now + 60, iat: now, inviteId: "inv-1" };
    const token = await createAccessToken(payload, "secret");
    const verified = await verifyAccessToken(token, "secret");
    expect(verified).toEqual(payload);
  });

  it("rejects invalid signatures", async () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = { kind: "admin" as const, exp: now + 60, iat: now };
    const token = await createAccessToken(payload, "secret");
    const verified = await verifyAccessToken(token, "other-secret");
    expect(verified).toBeNull();
  });

  it("rejects expired tokens", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T00:00:10Z"));

    const exp = Math.floor(Date.now() / 1000) - 1;
    const payload = { kind: "invite" as const, exp, iat: exp - 10 };
    const token = await createAccessToken(payload, "secret");
    const verified = await verifyAccessToken(token, "secret");
    expect(verified).toBeNull();
  });
});
