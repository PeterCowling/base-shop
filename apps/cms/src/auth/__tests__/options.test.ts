import type { Role } from "@acme/types";

jest.mock("@acme/shared-utils", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { logger } from "@acme/shared-utils";
import { createAuthOptions } from "../options";

type Authorize = (
  credentials: { email: string; password: string } | null
) => Promise<unknown>;

const getAuthorize = (overrides: Parameters<typeof createAuthOptions>[0]) => {
  const options = createAuthOptions(overrides);
  return (options.providers[0] as any).options.authorize as Authorize;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("authorize", () => {
  it("returns null when credentials are falsy", async () => {
    const readRbac = jest.fn();
    const authorize = getAuthorize({ readRbac });

    await expect(authorize(null)).resolves.toBeNull();
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

  it("throws when user is missing", async () => {
    const readRbac = jest.fn().mockResolvedValue({ users: {}, roles: {} });
    const authorize = getAuthorize({ readRbac });

    await expect(
      authorize({ email: "none@example.com", password: "pw" })
    ).rejects.toThrow("Invalid email or password");
    expect(logger.warn).toHaveBeenCalledWith("[auth] login failed");
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
      .mockResolvedValue(true);
    const authorize = getAuthorize({ readRbac, argonVerify });

    await expect(
      authorize({ email: "hashed@example.com", password: "secret" })
    ).resolves.toMatchObject({
      id: "2",
      email: "hashed@example.com",
      role: "admin",
    });
    expect(argonVerify).toHaveBeenCalledWith(hashed, "secret");
    expect(logger.info).toHaveBeenCalledWith("[auth] login success", {
      userId: "2",
      role: "admin",
    });
  });

  it("rejects when argon2 verification fails", async () => {
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

describe("session", () => {
  it("leaves role undefined when token lacks it", async () => {
    const options = createAuthOptions();
    const sessionCb = options.callbacks.session!;
    const session = { user: {} } as any;
    const result = await sessionCb({ session, token: {} as any });

    expect(result.user).not.toHaveProperty("role");
    expect(logger.debug).toHaveBeenCalledWith("[auth] session role", { role: undefined });
  });
});
