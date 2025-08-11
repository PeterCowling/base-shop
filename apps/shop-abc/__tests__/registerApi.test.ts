// apps/shop-abc/__tests__/registerApi.test.ts
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

import { POST } from "../src/app/register/route";
import { USER_STORE } from "../src/app/userStore";

describe("/register POST", () => {
  afterEach(() => {
    delete USER_STORE["newuser"];
  });

  it("rejects weak passwords", async () => {
    const req = {
      json: async () => ({
        customerId: "newuser",
        email: "user@example.com",
        password: "password",
      }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.password).toBeDefined();
  });

  it("accepts strong passwords", async () => {
    const req = {
      json: async () => ({
        customerId: "newuser",
        email: "user@example.com",
        password: "Str0ngPass",
      }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
