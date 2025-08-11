// apps/shop-abc/__tests__/authFlow.test.ts
import bcrypt from "bcryptjs";

const mockDb: Record<string, { email: string; passwordHash: string; role: string }> = {};

jest.mock("@acme/platform-core/users", () => ({
  __esModule: true,
  createUser: jest.fn(
    (email: string, passwordHash: string, role: string) => {
      mockDb[email] = { email, passwordHash, role };
      return Promise.resolve();
    },
  ),
  getUserByEmail: jest.fn((email: string) =>
    Promise.resolve(mockDb[email] ?? null),
  ),
  updateUserPassword: jest.fn(
    (email: string, passwordHash: string) => {
      if (mockDb[email]) {
        mockDb[email].passwordHash = passwordHash;
      }
      return Promise.resolve();
    },
  ),
}));

jest.mock("@auth", () => ({
  __esModule: true,
  createCustomerSession: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

import { POST as registerPOST } from "../src/app/api/register/route";
import { POST as loginPOST } from "../src/app/login/route";
import { POST as resetPOST } from "../src/app/api/password-reset/route";
import { createCustomerSession } from "@auth";

describe("auth flow", () => {
  beforeEach(() => {
    for (const k in mockDb) delete mockDb[k];
    jest.clearAllMocks();
  });

  test("sign-up, login and password reset", async () => {
    const email = "user@example.com";
    const password = "secret123";
    const newPassword = "newSecret123";

    const resSignup = await registerPOST({
      json: async () => ({ email, password }),
    } as any);
    expect(resSignup.status).toBe(200);
    expect(mockDb[email]).toBeDefined();
    expect(await bcrypt.compare(password, mockDb[email].passwordHash)).toBe(
      true,
    );

    const resLogin = await loginPOST({
      json: async () => ({ email, password }),
    } as any);
    expect(resLogin.status).toBe(200);
    expect(createCustomerSession).toHaveBeenCalledWith({
      customerId: email,
      role: "customer",
    });

    const resReset = await resetPOST({
      json: async () => ({ email, newPassword }),
    } as any);
    expect(resReset.status).toBe(200);
    expect(
      await bcrypt.compare(newPassword, mockDb[email].passwordHash),
    ).toBe(true);

    const resOldLogin = await loginPOST({
      json: async () => ({ email, password }),
    } as any);
    expect(resOldLogin.status).toBe(401);

    const resNewLogin = await loginPOST({
      json: async () => ({ email, password: newPassword }),
    } as any);
    expect(resNewLogin.status).toBe(200);
  });
});
