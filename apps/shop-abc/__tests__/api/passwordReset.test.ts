// apps/shop-abc/__tests__/api/passwordReset.test.ts
jest.mock("@lib/email", () => ({ __esModule: true, sendEmail: jest.fn() }));
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

import { sendEmail } from "@lib/email";
import { USER_STORE } from "../../src/app/userStore";
import { POST, PUT } from "../../src/app/api/account/reset/route";

describe("/api/account/reset", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    USER_STORE.cust1.password = "pass1";
    delete USER_STORE.cust1.resetToken;
  });

  it("sends reset token via email", async () => {
    const req = { json: async () => ({ email: "cust1@example.com" }) } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalled();
    const token = USER_STORE.cust1.resetToken;
    expect(typeof token).toBe("string");
  });

  it("resets password with valid token", async () => {
    USER_STORE.cust1.resetToken = "tok123";
    const req = { json: async () => ({ token: "tok123", password: "newpass" }) } as any;
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(USER_STORE.cust1.password).toBe("newpass");
    expect(USER_STORE.cust1.resetToken).toBeUndefined();
  });

  it("rejects invalid token", async () => {
    const req = { json: async () => ({ token: "bad", password: "x" }) } as any;
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});

