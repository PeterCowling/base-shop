// apps/cms/__tests__/authOptions.test.ts
/* eslint-env jest */

import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { CredentialsConfig } from "next-auth/providers/credentials";
import { authOptions } from "../src/auth/options";

/* -------------------------------------------------------------------------- */
/*  Mocks                                                                     */
/* -------------------------------------------------------------------------- */
/**
 * The Credentials provider fetches its users from
 * `../src/lib/rbacStore.readRbac()`. We stub that call so the provider always
 * finds a single admin user whose password is the plain-text string `"admin"`.
 *
 *  • id === "1" → password is compared as plain text
 *    (see implementation in `options.ts`)
 */
jest.doMock("../src/lib/rbacStore", () => ({
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

const credentialsProvider = authOptions.providers.find(isCredentialsProvider)!;

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("authOptions (Credentials provider)", () => {
  it("authorize returns user when credentials match", async () => {
    const user = await credentialsProvider.authorize!.call(
      undefined,
      { email: "admin@example.com", password: "admin" },
      undefined
    );

    expect(user).toMatchObject({
      id: expect.any(String),
      email: "admin@example.com",
      role: "admin",
    });
  });

  it("authorize throws when credentials are wrong", async () => {
    await expect(
      credentialsProvider.authorize!.call(
        undefined,
        { email: "admin@example.com", password: "wrong" },
        undefined
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
    });

    expect((token as JWT & { role?: string }).role).toBe("viewer");
  });

  it("session callback exposes role to the client session", async () => {
    const inputSession: Session = {
      user: {} as User,
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    };

    const adminToken = { role: "admin" } as JWT & { role: string };

    const session = await authOptions.callbacks!.session!.call(null, {
      session: inputSession,
      token: adminToken,
    });

    expect((session as Session & { user: { role?: string } }).user.role).toBe(
      "admin"
    );
  });
});
