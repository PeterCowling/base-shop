/* apps/cms/__tests__/authOptions.test.ts */
/* eslint-env jest */

/* -------------------------------------------------------------------------- */
/* 1.  Stub the RBAC store **before** importing authOptions                   */
/* -------------------------------------------------------------------------- */

const rbacStorePath = require.resolve("../src/lib/server/rbacStore");
const { ROLE_PERMISSIONS } = require("@auth/permissions");

jest.doMock(rbacStorePath, () => ({
  readRbac: async () => ({
    users: {
      "1": { id: "1", email: "admin@example.com", password: "admin" },
    },
    roles: { "1": "admin" },
    permissions: ROLE_PERMISSIONS,
  }),
}));

process.env.CART_COOKIE_SECRET = "test";
process.env.EMAIL_FROM = "test@example.com";

/* -------------------------------------------------------------------------- */
/* 2.  Imports                                                                */
/* -------------------------------------------------------------------------- */

import type { Account, Profile, Session, User, NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { CredentialsConfig } from "next-auth/providers/credentials";

/* -------------------------------------------------------------------------- */
/* 3.  Helpers                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Narrow a provider to `CredentialsConfig`.
 */
function isCredentialsProvider(p: unknown): p is CredentialsConfig {
  return (
    typeof p === "object" &&
    p !== null &&
    "type" in p &&
    (p as { type?: unknown }).type === "credentials"
  );
}

let authOptions: NextAuthOptions;
let authorize: (credentials: unknown, req: Record<string, never>) => unknown;

beforeAll(async () => {
  (process.env as Record<string, string>).NODE_ENV = "development";
  const mod = await import("../src/auth/options");
  authOptions = mod.authOptions;
  const provider = authOptions.providers.find(isCredentialsProvider);
  if (!provider) {
    throw new Error("Credentials provider not found in authOptions");
  }
  type AuthorizeFn = (
    credentials: unknown,
    req: Record<string, never>
  ) => unknown;
  authorize = (
    provider as unknown as { options: { authorize: AuthorizeFn } }
  ).options.authorize.bind(provider);
});

/* -------------------------------------------------------------------------- */
/* 4.  Tests                                                                  */
/* -------------------------------------------------------------------------- */

describe("authOptions (Credentials provider)", () => {
  it("authorize returns user when credentials match", async () => {
    const matchedUser = (await authorize(
      { email: "admin@example.com", password: "admin" },
      {} as Record<string, never> // RequestInternal placeholder
    )) as User & { role: string };

    expect(matchedUser).toMatchObject({
      id: expect.any(String),
      email: "admin@example.com",
      role: "admin",
    });
  });

  it("authorize throws when credentials are wrong", async () => {
    await expect(
      authorize(
        { email: "admin@example.com", password: "wrong" },
        {} as Record<string, never>
      )
    ).rejects.toThrow("Invalid email or password");
  });

  it("jwt callback forwards role onto the token", async () => {
    const viewerUser: User & { role: string } = {
      id: "viewer-id",
      email: "viewer@example.com",
      role: "viewer",
    };

    const token = await authOptions.callbacks!.jwt!.call(null, {
      token: {} as JWT,
      user: viewerUser,
      account: null as Account | null,
      profile: {} as Profile,
      isNewUser: false,
    });

    expect((token as JWT & { role?: string }).role).toBe("viewer");
  });

  it("jwt callback without user leaves token unchanged", async () => {
    const originalToken = { foo: "bar" } as JWT & { foo: string };

    const returnedToken = await authOptions.callbacks!.jwt!.call(null, {
      token: originalToken,
      user: undefined,
      account: null as Account | null,
      profile: {} as Profile,
      isNewUser: false,
    });

    expect(returnedToken).toBe(originalToken);
    expect((returnedToken as JWT & { role?: string }).role).toBeUndefined();
  });

  it("session callback exposes role to the client session", async () => {
    const baseSession: Session = {
      user: {} as User,
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    };

    const adminToken = { role: "admin" } as JWT & { role: string };
    const dummyUser = { id: "u", email: "x@example.com" } as User;

    const session = await authOptions.callbacks!.session!.call(null, {
      session: baseSession,
      token: adminToken,
      user: dummyUser,
      newSession: {} as Record<string, never>,
      trigger: "update",
    });

    expect((session as Session & { user: { role?: string } }).user.role).toBe(
      "admin"
    );
  });

  it("session callback without token role leaves session.user unmodified", async () => {
    const baseSession: Session = {
      user: {} as User,
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    };
    const token = {} as JWT;
    const dummyUser = { id: "u", email: "x@example.com" } as User;

    const session = await authOptions.callbacks!.session!.call(null, {
      session: baseSession,
      token,
      user: dummyUser,
      newSession: {} as Record<string, never>,
      trigger: "update",
    });

    expect(session).toBe(baseSession);
    expect("role" in session.user).toBe(false);
  });
});
