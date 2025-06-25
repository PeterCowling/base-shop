// apps/cms/__tests__/authOptions.test.ts
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { CredentialsConfig } from "next-auth/providers/credentials";
import { authOptions } from "../src/auth/options";

/** Narrow a provider to the Credentials variant */
function isCredentialsProvider(p: unknown): p is CredentialsConfig {
  return (
    typeof p === "object" &&
    p !== null &&
    "type" in p &&
    (p as { type?: unknown }).type === "credentials"
  );
}

describe("authOptions", () => {
  const provider = authOptions.providers.find(isCredentialsProvider)!;

  it("authorize returns user when credentials match", async () => {
    const user = await provider.authorize!.call(
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

  it("authorize returns null otherwise", async () => {
    const user = await provider.authorize!.call(
      undefined,
      { email: "admin@example.com", password: "wrong" },
      undefined
    );

    expect(user).toBeNull();
  });

  it("jwt callback forwards role", async () => {
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

  it("session callback exposes role", async () => {
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
