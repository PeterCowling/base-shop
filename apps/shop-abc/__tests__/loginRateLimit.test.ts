// apps/shop-abc/__tests__/loginRateLimit.test.ts
import { POST } from "../src/app/login/route";
import {
  __resetLoginRateLimiter,
  MAX_ATTEMPTS,
} from "../src/middleware";

function makeRequest(body: any, ip = "1.1.1.1") {
  return {
    json: async () => body,
    headers: new Headers({ "x-forwarded-for": ip }),
  } as any;
}

afterEach(() => __resetLoginRateLimiter());

describe("login rate limiting", () => {
  it("returns 429 after too many attempts", async () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const res = await POST(
        makeRequest({ customerId: "cust1", password: "wrong" }),
      );
      expect(res.status).toBe(401);
    }

    const locked = await POST(
      makeRequest({ customerId: "cust1", password: "wrong" }),
    );
    expect(locked.status).toBe(429);

    const stillLocked = await POST(
      makeRequest({ customerId: "cust1", password: "pass1" }),
    );
    expect(stillLocked.status).toBe(429);
  });
});
