import {
  createCustomerSession,
  getCustomerSession,
  CUSTOMER_SESSION_COOKIE,
  CSRF_TOKEN_COOKIE,
} from "../src/session";
import type { Role } from "../src/types";

const mockCookies = jest.fn();
const mockHeaders = jest.fn(() => ({ get: () => null }));
jest.mock("next/headers", () => ({
  cookies: () => mockCookies(),
  headers: () => mockHeaders(),
}));

function createStore() {
  const jar = new Map<string, string>();
  return {
    get: jest.fn((name: string) => {
      const value = jar.get(name);
      return value ? { name, value } : undefined;
    }),
    set: jest.fn((name: string, value: string) => {
      jar.set(name, value);
    }),
    delete: jest.fn((name: string) => {
      jar.delete(name);
    }),
  };
}

describe("customer session", () => {
  const originalSecret = process.env.SESSION_SECRET;
  beforeEach(() => {
    process.env.SESSION_SECRET =
      "0123456789abcdefghijklmnopqrstuvwxyz012345"; // 40 chars
    mockCookies.mockReset();
  });
  afterAll(() => {
    if (originalSecret !== undefined) {
      process.env.SESSION_SECRET = originalSecret;
    } else {
      delete process.env.SESSION_SECRET;
    }
  });

  it("rotates token and refreshes on activity", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const session = { customerId: "abc", role: "customer" as Role };

    await createCustomerSession(session);
    const [name, firstToken, firstOpts] = store.set.mock.calls[0];
    expect(name).toBe(CUSTOMER_SESSION_COOKIE);
    expect(firstOpts).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/",
      maxAge: expect.any(Number),
    });

    const [csrfName, csrfToken, csrfOpts] = store.set.mock.calls[1];
    expect(csrfName).toBe(CSRF_TOKEN_COOKIE);
    expect(csrfOpts).toMatchObject({
      httpOnly: false,
      sameSite: "strict",
      secure: true,
      path: "/",
      maxAge: expect.any(Number),
    });

    await expect(getCustomerSession()).resolves.toEqual(session);
    const secondToken = store.set.mock.calls[2][1];
    expect(secondToken).not.toBe(firstToken);
    const secondOpts = store.set.mock.calls[2][2];
    expect(secondOpts).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/",
      maxAge: expect.any(Number),
    });
  });

  it("rotates token on subsequent login", async () => {
    const store = createStore();
    mockCookies.mockResolvedValue(store);
    const session = { customerId: "abc", role: "customer" as Role };

    await createCustomerSession(session);
    const firstToken = store.set.mock.calls[0][1];

    await createCustomerSession(session);
    const secondToken = store.set.mock.calls[2][1];
    expect(secondToken).not.toBe(firstToken);
  });
});

