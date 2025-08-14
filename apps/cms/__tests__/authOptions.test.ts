/* apps/cms/__tests__/authOptions.test.ts */
/* eslint-env jest */

/* -------------------------------------------------------------------------- */
/* 1.  Stub the RBAC store **before** importing authOptions                   */
/* -------------------------------------------------------------------------- */

/* eslint-disable @typescript-eslint/no-var-requires */
const rbacStorePath = require.resolve("../src/lib/rbacStore");
const { ROLE_PERMISSIONS } = require("@auth/permissions");
/* eslint-enable @typescript-eslint/no-var-requires */

jest.doMock(rbacStorePath, () => ({
  readRbac: async () => ({
    users: {
      "1": {
        id: "1",
        email: "admin@example.com",
        password: "$2b$10$2cZYn4hpcuv7iNSOFYugsO4YrHjxd2rcWG8KrUOt4e6H1LuxE4ws6",
      },
    },
    roles: { "1": "admin" },
    permissions: ROLE_PERMISSIONS,
  }),
}));

process.env.CART_COOKIE_SECRET = "test";

/* -------------------------------------------------------------------------- */
/* 2.  Imports                                                                */
/* -------------------------------------------------------------------------- */

import type { Account, Profile, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { CredentialsConfig } from "next-auth/providers/credentials";
import { authOptions } from "../src/auth/options";

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

const provider = authOptions.providers.find(isCredentialsProvider);
if (!provider) {
  throw new Error("Credentials provider not found in authOptions");
}

/**
 * `NextAuth` nests provider-specific callbacks under `options`.
 * We bind its `this` value to the provider to mimic production.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const authorize = (
  provider as unknown as { options: { authorize: Function } }
).options.authorize.bind(provider);

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
});
