/** @jest-environment node */

jest.mock("@acme/zod-utils/initZod", () => ({}));

jest.mock("argon2", () => {
  const hash = jest.fn(async (password: string) => `hashed:${password}`);
  return {
    __esModule: true,
    default: { hash },
    hash,
  };
});

interface StoreUser {
  id: string;
  email: string;
  passwordHash: string;
  resetToken: string | null;
  resetTokenExpiresAt: Date | null;
}

const store: Record<string, StoreUser> = {};

jest.mock("@platform-core/users", () => ({
  __esModule: true,
  getUserByEmail: jest.fn(async (email: string) => {
    const user = Object.values(store).find((u) => u.email === email);
    if (!user) throw new Error("User not found");
    return user;
  }),
  setResetToken: jest.fn(async (id: string, token: string | null, expires: Date | null) => {
    const user = store[id];
    if (!user) throw new Error("User not found");
    user.resetToken = token;
    user.resetTokenExpiresAt = expires;
  }),
  getUserByResetToken: jest.fn(async (token: string) => {
    const user = Object.values(store).find(
      (u) => u.resetToken === token && u.resetTokenExpiresAt && u.resetTokenExpiresAt > new Date(),
    );
    if (!user) throw new Error("User not found");
    return user;
  }),
  updatePassword: jest.fn(async (id: string, password: string) => {
    const user = store[id];
    if (!user) throw new Error("User not found");
    user.passwordHash = password;
  }),
}));

import { POST as requestPOST } from "../src/app/api/password-reset/request/route";
import { POST as resetPOST } from "../src/app/api/password-reset/[token]/route";

describe("password reset integration", () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
    store["u1"] = {
      id: "u1",
      email: "u1@example.com",
      passwordHash: "old",
      resetToken: null,
      resetTokenExpiresAt: null,
    };
  });

  it("resets password with valid token", async () => {
    const req = new Request("http://localhost/api/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "u1@example.com" }),
    });
    const res = await requestPOST(req);
    expect(res.status).toBe(200);
    const { token } = await res.json();
    expect(token).toBeDefined();

    const newPassword = "newpass123";
    const hashedPassword = `hashed:${newPassword}`;

    const req2 = new Request(`http://localhost/api/password-reset/${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    const res2 = await resetPOST(req2, { params: { token } });
    expect(res2.status).toBe(200);
    await expect(res2.json()).resolves.toEqual({ ok: true });
    const { updatePassword } = jest.requireMock("@platform-core/users") as {
      updatePassword: jest.Mock;
    };
    expect(updatePassword).toHaveBeenCalledWith("u1", hashedPassword);
    expect(updatePassword).not.toHaveBeenCalledWith("u1", newPassword);
    expect(store["u1"].passwordHash).toBe(hashedPassword);
    expect(store["u1"].resetToken).toBeNull();
  });

  it("returns error for expired token", async () => {
    const req = new Request("http://localhost/api/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "u1@example.com" }),
    });
    const res = await requestPOST(req);
    const { token } = await res.json();
    expect(token).toBeDefined();
    await new Promise((r) => setTimeout(r, 1100));
    const req2 = new Request(`http://localhost/api/password-reset/${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "newpass123" }),
    });
    const res2 = await resetPOST(req2, { params: { token } });
    expect(res2.status).toBe(400);
    const body = await res2.json();
    expect(body.error).toMatch(/invalid or expired/i);
  });

  it("returns error for invalid token", async () => {
    const req = new Request("http://localhost/api/password-reset/bad", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "newpass123" }),
    });
    const res = await resetPOST(req, { params: { token: "bad" } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid or expired/i);
  });
});
