// packages/platform-core/__tests__/authOptions.test.ts
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { CredentialsConfig } from "next-auth/providers/credentials";
import { authOptions } from "../src/auth/options";

function isCredentialsProvider(p: unknown): p is CredentialsConfig {
  return (
    typeof p === "object" && p !== null && (p as any).type === "credentials"
  );
}

describe("authOptions", () => {
  // --- provider with an `authorize` method ---------------------------------
  const provider = authOptions.providers.find(isCredentialsProvider)!;

  it("authorize returns user when credentials match", async () => {
    const user = await provider.authorize!.call(
      null,
      { email: "admin@example.com", password: "admin" },
      null // req – not needed in unit test
    );

    expect(user).toMatchObject({ email: "admin@example.com", role: "admin" });
  });

  it("authorize returns null otherwise", async () => {
    const user = await provider.authorize!.call(
      null,
      { email: "admin@example.com", password: "wrong" },
      null
    );

    expect(user).toBeNull();
  });

  it("jwt callback forwards role", async () => {
    const token = (await authOptions.callbacks!.jwt!.call(null, {
      token: {} as JWT,
      user: { email: "x", role: "viewer" } as any,
    })) as JWT & { role?: string };

    expect(token).toHaveProperty("role", "viewer");
  });

  it("session callback exposes role", async () => {
    const inputSession = {
      user: {},
      expires: new Date(Date.now() + 86_400_000).toISOString(), // +1 day
    } as Session;

    const session = (await authOptions.callbacks!.session!.call(null, {
      session: inputSession,
      token: { role: "admin" } as any,
    })) as Session & { user: { role?: string } };

    expect(session.user).toHaveProperty("role", "admin");
  });
});
