// apps/shop-abc/__tests__/registerRateLimit.test.ts
jest.mock("@upstash/redis", () => ({
  Redis: jest.fn(() => ({})),
}));

let POST: typeof import("../src/app/register/route").POST;
let __resetRegistrationRateLimiter: typeof import("../src/middleware").__resetRegistrationRateLimiter;
let MAX_ATTEMPTS: number;
let USER_STORE: typeof import("../src/app/userStore").USER_STORE;

beforeAll(async () => {
  ({ __resetRegistrationRateLimiter, MAX_ATTEMPTS } = await import("../src/middleware"));
  ({ POST } = await import("../src/app/register/route"));
  ({ USER_STORE } = await import("../src/app/userStore"));
});

function makeRequest(body: any, ip = "2.2.2.2") {
  return {
    json: async () => body,
    headers: new Headers({ "x-forwarded-for": ip }),
  } as any;
}

const initialKeys = new Set<string>();

beforeAll(() => {
  for (const key of Object.keys(USER_STORE)) initialKeys.add(key);
});

afterEach(async () => {
  await __resetRegistrationRateLimiter();
  for (const key of Object.keys(USER_STORE)) {
    if (!initialKeys.has(key)) delete USER_STORE[key];
  }
});

describe("registration rate limiting", () => {
  it("returns 429 after too many attempts", async () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const res = await POST(
        makeRequest({
          customerId: `new${i}`,
          email: `new${i}@example.com`,
          password: "pass",
        }),
      );
      expect(res.status).toBe(200);
    }

    const locked = await POST(
      makeRequest({
        customerId: "last",
        email: "last@example.com",
        password: "pass",
      }),
    );
    expect(locked.status).toBe(429);

    const stillLocked = await POST(
      makeRequest({
        customerId: "another",
        email: "another@example.com",
        password: "pass",
      }),
    );
    expect(stillLocked.status).toBe(429);
  });
});
