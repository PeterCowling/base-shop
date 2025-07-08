// apps/cms/__tests__/authOptions.test.ts
/* eslint-env jest */

/* -------------------------------------------------------------------------- */
/*  FIRST: stub the RBAC store                                                */
/* -------------------------------------------------------------------------- */
/**
 * Using `require.resolve` guarantees we mock the *exact* module instance
 * that `src/auth/options.ts` imports, regardless of how each file’s relative
 * path is written.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const rbacStorePath = require.resolve("../src/lib/rbacStore");
/* eslint-enable @typescript-eslint/no-var-requires */

jest.doMock(rbacStorePath, () => ({
  readRbac: async () => ({
    users: {
      "1": {
        id: "1",
        email: "admin@example.com",
        password: "admin",
      },
    },
    roles: {
      "1": "admin",
    },
  }),
}));

/* -------------------------------------------------------------------------- */
/*  THEN import what depends on that store                                    */
/* -------------------------------------------------------------------------- */
import type { Account, Profile, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { CredentialsConfig } from "next-auth/providers/credentials";
import { authOptions } from "../src/auth/options";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
function isCredentialsProvider(p: unknown): p is CredentialsConfig {
  return (
    typeof p === "object" &&
    p !== null &&
    "type" in p &&
    (p as { type?: unknown }).type === "credentials"
  );
}

const provider = authOptions.providers.find(isCredentialsProvider)!;

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("authOptions (Credentials provider)", () => {
  it("authorize returns user when credentials match", async () => {
    const user = await provider.authorize!.call(
      undefined,
      { email: "admin@example.com", password: "admin" },
      {} as any // ⬅️ satisfy RequestInternal
    );

    expect(user).toMatchObject({
      id: expect.any(String),
      email: "admin@example.com",
      role: "admin",
    });
  });

  it("authorize throws when credentials are wrong", async () => {
    await expect(
      provider.authorize!.call(
        undefined,
        { email: "admin@example.com", password: "wrong" },
        {} as any
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
    const inputSession: Session = {
      user: {} as User,
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    };

    const adminToken = { role: "admin" } as JWT & { role: string };
    const dummyUser = { id: "u", email: "x@example.com" } as User;

    const session = await authOptions.callbacks!.session!.call(null, {
      session: inputSession,
      token: adminToken,
      user: dummyUser,
      newSession: {} as any,
      trigger: "update",
    });

    expect((session as Session & { user: { role?: string } }).user.role).toBe(
      "admin"
    );
  });
});
