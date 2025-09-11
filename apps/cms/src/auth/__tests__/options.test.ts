import type { Role } from "@acme/types";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

jest.mock("@acme/shared-utils", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { logger } from "@acme/shared-utils";
import { createAuthOptions, type AuthOverrides } from "../options";

type Authorize = (
  credentials?: { email: string; password: string } | null
) => Promise<unknown>;

const getAuthorize = (overrides: AuthOverrides) => {
  const options = createAuthOptions(overrides);
  return (options.providers[0] as any).options.authorize as Authorize;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("authorize", () => {
  it("returns null when credentials are null", async () => {
    const readRbac = jest.fn();
    const authorize = getAuthorize({ readRbac });

    await expect(authorize(null)).resolves.toBeNull();
    expect(readRbac).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith("[auth] authorize called");
  });

  it("returns null when credentials are undefined", async () => {
    const readRbac = jest.fn();
    const authorize = getAuthorize({ readRbac });

    await expect(authorize(undefined)).resolves.toBeNull();
    expect(readRbac).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith("[auth] authorize called");
  });

  it("allows dev fixture in development", async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const readRbac = jest.fn().mockResolvedValue({
      users: {
        "1": { id: "1", email: "dev@example.com", password: "pw" },
      },
      roles: { "1": "admin" as Role },
    });
    const argonVerify = jest.fn();
    const authorize = getAuthorize({ readRbac, argonVerify });

    await expect(
      authorize({ email: "dev@example.com", password: "pw" })
    ).resolves.toMatchObject({ id: "1", email: "dev@example.com", role: "admin" });
    expect(argonVerify).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("[auth] login success", {
      userId: "1",
      role: "admin",
    });

    process.env.NODE_ENV = prevEnv;
  });

  it("logs when user password is not hashed", async () => {
    const readRbac = jest.fn().mockResolvedValue({
      users: {
        "2": { id: "2", email: "user@example.com", password: "plain" },
      },
      roles: {},
    });
    const authorize = getAuthorize({ readRbac });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await expect(
      authorize({ email: "user@example.com", password: "plain" })
    ).rejects.toThrow("Invalid email or password");
    expect(logSpy).toHaveBeenCalledWith("[auth] user password is not hashed", {
      id: "2",
    });

    logSpy.mockRestore();
  });

  it("throws in production when password is not hashed", async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const readRbac = jest.fn().mockResolvedValue({
      users: {
        "2": { id: "2", email: "user@example.com", password: "plain" },
      },
      roles: {},
    });
    const authorize = getAuthorize({ readRbac });

    await expect(
      authorize({ email: "user@example.com", password: "plain" })
    ).rejects.toThrow("Invalid email or password");

    process.env.NODE_ENV = prevEnv;
  });

  it("throws when user is missing", async () => {
    const readRbac = jest.fn().mockResolvedValue({ users: {}, roles: {} });
    const authorize = getAuthorize({ readRbac });

    await expect(
      authorize({ email: "none@example.com", password: "pw" })
    ).rejects.toThrow("Invalid email or password");
    expect(logger.warn).toHaveBeenCalledWith("[auth] login failed");
  });

  it("authorizes hashed password, assigns role, and strips password", async () => {
    const hashed = "$argon2id$hashed";
    const readRbac = jest.fn().mockResolvedValue({
      users: {
        "2": { id: "2", email: "hashed@example.com", password: hashed },
      },
      roles: { "2": "admin" as Role },
    });
    const argonVerify = jest.fn().mockResolvedValue(true);
    const authorize = getAuthorize({ readRbac, argonVerify });

    const result = await authorize({
      email: "hashed@example.com",
      password: "secret",
    });

    expect(result).toMatchObject({
      id: "2",
      email: "hashed@example.com",
      role: "admin",
    });
    expect(result).not.toHaveProperty("password");
    expect(argonVerify).toHaveBeenCalledWith(hashed, "secret");
    expect(logger.info).toHaveBeenCalledWith("[auth] login success", {
      userId: "2",
      role: "admin",
    });
  });

  it("handles roles provided as arrays", async () => {
    const hashed = "$argon2id$hashed";
    const readRbac = jest.fn().mockResolvedValue({
      users: {
        "2": { id: "2", email: "array@example.com", password: hashed },
      },
      roles: { "2": ["guest"] },
    });
    const argonVerify = jest.fn().mockResolvedValue(true);
    const authorize = getAuthorize({ readRbac, argonVerify });

    const result = await authorize({
      email: "array@example.com",
      password: "secret",
    });

    expect(result).toMatchObject({
      id: "2",
      email: "array@example.com",
      role: "guest",
    });
    expect(argonVerify).toHaveBeenCalledWith(hashed, "secret");
    expect(logger.info).toHaveBeenCalledWith("[auth] login success", {
      userId: "2",
      role: "guest",
    });
  });

  it("throws when hashed password does not match", async () => {
    const hashed = "$argon2id$hashed";
    const readRbac = jest.fn().mockResolvedValue({
      users: {
        "2": { id: "2", email: "hashed@example.com", password: hashed },
      },
      roles: { "2": "admin" as Role },
    });
    const argonVerify = jest.fn().mockResolvedValue(false);
    const authorize = getAuthorize({ readRbac, argonVerify });

    await expect(
      authorize({ email: "hashed@example.com", password: "wrong" })
    ).rejects.toThrow("Invalid email or password");
    expect(argonVerify).toHaveBeenCalledWith(hashed, "wrong");
    expect(logger.warn).toHaveBeenCalledWith("[auth] login failed");
  });
});

describe("callbacks", () => {
  it("stores role in jwt and exposes it in session", async () => {
    const options = createAuthOptions();
    const jwtCb = options.callbacks.jwt!;
    const sessionCb = options.callbacks.session!;

    const token = {} as JWT & { role?: Role };
    const user = { id: "1", role: "admin" as Role };
    const withRole = await jwtCb({ token, user });

    expect((withRole as JWT & { role?: Role }).role).toBe("admin");

    const session = { user: {} } as Session & { user: { role?: Role } };
    const result = await sessionCb({ session, token: withRole });
    expect(result.user.role).toBe("admin");
  });

  it("keeps token role when user is absent", async () => {
    const options = createAuthOptions();
    const jwtCb = options.callbacks.jwt!;

    const token = { role: "admin" as Role } as JWT & { role?: Role };
    const result = await jwtCb({ token });

    expect((result as JWT & { role?: Role }).role).toBe("admin");
  });

  it("assigns guest role in session", async () => {
    const options = createAuthOptions();
    const sessionCb = options.callbacks.session!;
    const session = { user: {} } as Session & { user: { role?: Role } };

    const result = await sessionCb({
      session,
      token: { role: "guest" } as JWT & { role: Role },
    });
    expect(result.user.role).toBe("guest");
  });

  it("leaves role undefined when token lacks it", async () => {
    const options = createAuthOptions();
    const sessionCb = options.callbacks.session!;
    const session = { user: {} } as Session & { user: { role?: Role } };

    const result = await sessionCb({ session, token: {} as JWT });
    expect(result.user.role).toBeUndefined();
  });
});
