// apps/shop-abc/__tests__/registerRateLimit.test.ts
jest.mock("@upstash/redis", () => ({
  Redis: jest.fn(() => ({})),
}));

jest.mock("@platform-core/users", () => ({
  createUser: jest.fn().mockResolvedValue(undefined),
  getUserById: jest.fn().mockResolvedValue(null),
  getUserByEmail: jest.fn().mockResolvedValue(null),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed"),
}));

jest.mock("@auth", () => ({
  validateCsrfToken: jest.fn().mockResolvedValue(true),
}));

let POST: typeof import("../src/app/register/route").POST;
let __resetRegistrationRateLimiter: typeof import("../src/middleware").__resetRegistrationRateLimiter;
let MAX_REGISTRATION_ATTEMPTS: number;

beforeAll(async () => {
  ({ __resetRegistrationRateLimiter, MAX_REGISTRATION_ATTEMPTS } = await import(
    "../src/middleware"
  ));
  ({ POST } = await import("../src/app/register/route"));
});

function makeRequest(body: any, ip = "1.1.1.1") {
    return {
      json: async () => body,
      headers: new Headers({
        "x-forwarded-for": ip,
        "x-csrf-token": "tok",
      }),
    } as any;
}

afterEach(async () => {
  await __resetRegistrationRateLimiter();
});

describe("registration rate limiting", () => {
  it("returns 429 after too many attempts", async () => {
    for (let i = 0; i < MAX_REGISTRATION_ATTEMPTS; i++) {
      const res = await POST(
        makeRequest({
          customerId: `cust${i}`,
          email: `test${i}@example.com`,
          password: "pw",
        }),
      );
      expect(res.status).toBe(200);
    }

    const locked = await POST(
      makeRequest({
        customerId: "cust-final",
        email: "final@example.com",
        password: "pw",
      }),
    );
    expect(locked.status).toBe(429);

    const stillLocked = await POST(
      makeRequest({
        customerId: "cust-other",
        email: "other@example.com",
        password: "pw",
      }),
    );
    expect(stillLocked.status).toBe(429);
  });
});
