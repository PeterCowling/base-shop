/** @jest-environment node */

jest.mock("@acme/zod-utils/initZod", () => ({}));

jest.mock("@acme/email", () => ({ sendEmail: jest.fn() }));

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

import { sendEmail } from "@acme/email";
import { POST as requestPOST } from "../src/app/api/password-reset/request/route";
import { POST as resetPOST } from "../src/app/api/password-reset/[token]/route";

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

describe("password reset integration", () => {
  beforeEach(() => {
    mockSendEmail.mockReset();
    mockSendEmail.mockResolvedValue(undefined);
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
    const responseBody = await res.json();
    expect(responseBody).toEqual({ ok: true });
    const token = store["u1"].resetToken;
    if (!token) {
      throw new Error("expected reset token to be set");
    }
    expect(token).toHaveLength(32);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      "u1@example.com",
      "Reset your Base Shop password",
      `Use this code to reset your password: ${token}`
    );

    const req2 = new Request(`http://localhost/api/password-reset/${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "newpass123" }),
    });
    const res2 = await resetPOST(req2, { params: { token } });
    expect(res2.status).toBe(200);
    const resetBody = await res2.json();
    expect(resetBody).toEqual({ ok: true });
    expect(store["u1"].passwordHash).toBe("newpass123");
    expect(store["u1"].resetToken).toBeNull();
  });

  it("returns error for expired token", async () => {
    const req = new Request("http://localhost/api/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "u1@example.com" }),
    });
    const res = await requestPOST(req);
    expect(res.status).toBe(200);
    const responseBody = await res.json();
    expect(responseBody).toEqual({ ok: true });
    const token = store["u1"].resetToken;
    if (!token) {
      throw new Error("expected reset token to be set");
    }
    expect(token).toHaveLength(32);
    await new Promise((r) => setTimeout(r, 1100));
    const req2 = new Request(`http://localhost/api/password-reset/${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "newpass123" }),
    });
    const res2 = await resetPOST(req2, { params: { token } });
    expect(res2.status).toBe(400);
    const errorBody = await res2.json();
    expect(errorBody.error).toMatch(/invalid or expired/i);
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
