// apps/shop-abc/__tests__/accountResetApi.test.ts
jest.mock("@platform-core/users", () => ({
  __esModule: true,
  getUserByEmail: jest.fn(),
  setResetToken: jest.fn(),
  getUserByResetToken: jest.fn(),
  updateUserPassword: jest.fn(),
}));

jest.mock("@lib/email", () => ({
  __esModule: true,
  sendEmail: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: { hash: jest.fn().mockResolvedValue("hashed") },
}));

import {
  getUserByEmail,
  setResetToken,
  getUserByResetToken,
  updateUserPassword,
} from "@platform-core/users";
import { sendEmail } from "@lib/email";
import { POST as requestPOST } from "../src/app/api/account/reset/request/route";
import { POST as completePOST } from "../src/app/api/account/reset/complete/route";

describe("/api/account/reset/request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates input", async () => {
    const req = { json: async () => ({}) } as any;
    const res = await requestPOST(req);
    expect(res.status).toBe(400);
  });

  it("sends token when user exists", async () => {
    (getUserByEmail as jest.Mock).mockResolvedValue({ id: "u1", email: "a@test.com" });
    const req = { json: async () => ({ email: "a@test.com" }) } as any;
    const res = await requestPOST(req);
    expect(res.status).toBe(200);
    expect(setResetToken).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
  });
});

describe("/api/account/reset/complete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns error for invalid token", async () => {
    (getUserByResetToken as jest.Mock).mockResolvedValue(null);
    const req = { json: async () => ({ token: "t", password: "pass123" }) } as any;
    const res = await completePOST(req);
    expect(res.status).toBe(400);
  });

  it("updates password with valid token", async () => {
    (getUserByResetToken as jest.Mock).mockResolvedValue({ id: "u1" });
    const req = { json: async () => ({ token: "t", password: "pass123" }) } as any;
    const res = await completePOST(req);
    expect(res.status).toBe(200);
    expect(updateUserPassword).toHaveBeenCalledWith("u1", expect.any(String));
    expect(setResetToken).toHaveBeenCalledWith("u1", null);
  });
});
