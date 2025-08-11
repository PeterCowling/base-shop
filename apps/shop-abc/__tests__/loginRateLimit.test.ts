// apps/shop-abc/__tests__/loginRateLimit.test.ts
jest.mock("@auth", () => ({
  createCustomerSession: jest.fn(),
}));
jest.mock("@upstash/redis", () => ({
  Redis: jest.fn(() => ({})),
}));
jest.mock("@platform-core/users", () => {
  const bcrypt = require("bcryptjs");
  return {
    getUserById: jest.fn(async () => ({
      id: "cust1",
      email: "test@example.com",
      passwordHash: bcrypt.hashSync("password1", 10),
      role: "customer",
      resetToken: null,
    })),
  };
});

let POST: typeof import("../src/app/login/route").POST;
let __resetLoginRateLimiter: typeof import("../src/middleware").__resetLoginRateLimiter;
let MAX_ATTEMPTS: number;

beforeAll(async () => {
  ({ __resetLoginRateLimiter, MAX_ATTEMPTS } = await import("../src/middleware"));
  ({ POST } = await import("../src/app/login/route"));
});

function makeRequest(body: any, ip = "1.1.1.1") {
  return {
    json: async () => body,
    headers: new Headers({ "x-forwarded-for": ip }),
  } as any;
}

afterEach(async () => {
  await __resetLoginRateLimiter();
});

describe("login rate limiting", () => {
  it("returns 429 after too many attempts", async () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const res = await POST(
        makeRequest({ customerId: "cust1", password: "wrongpass" }),
      );
      expect(res.status).toBe(401);
    }

    const locked = await POST(
      makeRequest({ customerId: "cust1", password: "wrongpass" }),
    );
    expect(locked.status).toBe(429);

    const stillLocked = await POST(
      makeRequest({ customerId: "cust1", password: "password1" }),
    );
    expect(stillLocked.status).toBe(429);
  });
});
