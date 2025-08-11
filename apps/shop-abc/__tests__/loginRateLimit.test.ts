// apps/shop-abc/__tests__/loginRateLimit.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  createCustomerSession: jest.fn(),
}));
jest.mock("@acme/platform-core/users", () => {
  const store = new Map<string, any>();
  return {
    __esModule: true,
    getUser: (id: string) => Promise.resolve(store.get(id) ?? null),
    getUserByEmail: (email: string) =>
      Promise.resolve(
        [...store.values()].find((u) => u.email === email) ?? null,
      ),
    createUser: (data: any) => {
      store.set(data.customerId, data);
      return Promise.resolve(data);
    },
    updateUserPassword: (id: string, passwordHash: string) => {
      const user = store.get(id);
      if (user) {
        user.passwordHash = passwordHash;
        store.set(id, user);
      }
      return Promise.resolve(user);
    },
    __reset: () => store.clear(),
  };
});

import { POST } from "../src/app/login/route";
import {
  __resetLoginRateLimiter,
  MAX_ATTEMPTS,
} from "../src/middleware";
import { POST as register } from "../src/app/api/register/route";
import * as usersModule from "@acme/platform-core/users";
const __resetUsers = (usersModule as any).__reset as () => void;

function makeRequest(body: any, ip = "1.1.1.1") {
  return {
    json: async () => body,
    headers: new Headers({ "x-forwarded-for": ip }),
  } as any;
}

beforeEach(async () => {
  __resetUsers();
  __resetLoginRateLimiter();
  await register(
    makeRequest({
      customerId: "cust1",
      email: "cust1@test.com",
      password: "pass1",
    }),
  );
});

afterEach(() => {
  __resetLoginRateLimiter();
  __resetUsers();
});

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
