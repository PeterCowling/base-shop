// apps/shop-abc/__tests__/authFlow.test.ts
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

import { POST as register } from "../src/app/api/register/route";
import { POST as login } from "../src/app/login/route";
import { POST as reset } from "../src/app/api/password-reset/route";
import * as usersModule from "@acme/platform-core/users";
const __resetUsers = (usersModule as any).__reset as () => void;

function makeRequest(body: any, ip = "1.1.1.1") {
  return {
    json: async () => body,
    headers: new Headers({ "x-forwarded-for": ip }),
  } as any;
}

beforeEach(() => {
  __resetUsers();
});

beforeAll(() => {
  process.env.SESSION_SECRET = "test";
});

afterAll(() => {
  delete process.env.SESSION_SECRET;
});

describe("auth flows", () => {
  it("allows sign-up and login", async () => {
    let res = await register(
      makeRequest({
        customerId: "cust1",
        email: "cust1@test.com",
        password: "pass1",
      }),
    );
    expect(res.status).toBe(200);

    res = await login(makeRequest({ customerId: "cust1", password: "pass1" }));
    expect(res.status).toBe(200);
  });

  it("rejects duplicate emails", async () => {
    await register(
      makeRequest({
        customerId: "cust2",
        email: "cust2@test.com",
        password: "pass1",
      }),
    );
    const dup = await register(
      makeRequest({
        customerId: "cust3",
        email: "cust2@test.com",
        password: "pass2",
      }),
    );
    expect(dup.status).toBe(409);
  });

  it("resets password and logs in with new password", async () => {
    await register(
      makeRequest({
        customerId: "cust4",
        email: "cust4@test.com",
        password: "oldpass",
      }),
    );

    let res = await reset(
      makeRequest({ email: "cust4@test.com", password: "newpass" }),
    );
    expect(res.status).toBe(200);

    const oldLogin = await login(
      makeRequest({ customerId: "cust4", password: "oldpass" }),
    );
    expect(oldLogin.status).toBe(401);

    const newLogin = await login(
      makeRequest({ customerId: "cust4", password: "newpass" }),
    );
    expect(newLogin.status).toBe(200);
  });
});

