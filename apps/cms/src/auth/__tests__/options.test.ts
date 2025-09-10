import { createAuthOptions } from "../options";
import type { Role } from "@acme/types";

describe("authorize", () => {
  it("returns null when no credentials provided", async () => {
    const options = createAuthOptions();
    const authorize = (options.providers[0] as any).options.authorize as (
      credentials?: unknown
    ) => Promise<unknown>;

    await expect(authorize(undefined)).resolves.toBeNull();
  });

  it("throws on plain-text password", async () => {
    const readRbac = jest.fn().mockResolvedValue({
      users: {
        "1": { id: "1", email: "user@example.com", password: "plain" },
      },
      roles: {},
    });

    const options = createAuthOptions({ readRbac });
    const authorize = (options.providers[0] as any).options.authorize as (
      credentials: { email: string; password: string }
    ) => Promise<unknown>;

    await expect(
      authorize({ email: "user@example.com", password: "plain" })
    ).rejects.toThrow("Invalid email or password");
  });

  it("authorizes hashed password and assigns role", async () => {
    const hashed = "$argon2id$hashed";
    const readRbac = jest.fn().mockResolvedValue({
      users: {
        "2": { id: "2", email: "hashed@example.com", password: hashed },
      },
      roles: { "2": "admin" as Role },
    });
    const argonVerify = jest
      .fn()
      .mockImplementation(async (pwHash: string, pw: string) =>
        pwHash === hashed && pw === "secret"
      );

    const options = createAuthOptions({ readRbac, argonVerify });
    const authorize = (options.providers[0] as any).options.authorize as (
      credentials: { email: string; password: string }
    ) => Promise<{ id: string; email: string; role: Role }>;

    await expect(
      authorize({ email: "hashed@example.com", password: "secret" })
    ).resolves.toMatchObject({
      id: "2",
      email: "hashed@example.com",
      role: "admin",
    });
    expect(argonVerify).toHaveBeenCalledWith(hashed, "secret");
  });
});
