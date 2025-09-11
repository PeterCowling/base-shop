// packages/platform-core/__tests__/repoResolver.test.ts
import { resolveRepo } from "../src/repositories/repoResolver";

describe("resolveRepo", () => {
  const prismaDelegate = jest.fn();
  const prismaModule = jest.fn<Promise<string>, []>(() => Promise.resolve("prisma"));
  const jsonModule = jest.fn<Promise<string>, []>(() => Promise.resolve("json"));

  afterEach(() => {

    delete process.env.INVENTORY_BACKEND;
    delete process.env.DATABASE_URL;
    delete process.env.DB_MODE;
    jest.clearAllMocks();
  });

  it("uses json module when backend is explicitly json", async () => {
    process.env.INVENTORY_BACKEND = "json";

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
      }),
    ).resolves.toBe("json");

    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
  });

  it("defaults to json when no backend env vars or DATABASE_URL are set", async () => {
    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
      }),
    ).resolves.toBe("json");

    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
    
  });

  it("uses prisma module when DATABASE_URL is set and delegate returns truthy", async () => {
    process.env.DATABASE_URL = "postgres://example";
    prismaDelegate.mockReturnValue({});

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
      }),
    ).resolves.toBe("prisma");

    expect(prismaModule).toHaveBeenCalledTimes(1);
    expect(jsonModule).not.toHaveBeenCalled();
    
  });

  it("falls back to json module when delegate throws", async () => {
    process.env.DATABASE_URL = "postgres://example";
    prismaDelegate.mockImplementation(() => {
      throw new Error("fail");
    });

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
      }),
    ).resolves.toBe("json");

    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
    
  });

  it("falls back to json module when delegate returns falsy", async () => {
    process.env.DATABASE_URL = "postgres://example";
    prismaDelegate.mockReturnValue(undefined);

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
      }),
    ).resolves.toBe("json");

    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
  });

  it("uses DB_MODE when repo-specific backend var is unset", async () => {
    process.env.DB_MODE = "json";

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
      }),
    ).resolves.toBe("json");

    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
  });

  it("repo-specific backend var overrides DB_MODE", async () => {
    process.env.DB_MODE = "json";
    process.env.INVENTORY_BACKEND = "postgres";

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
      }),
    ).resolves.toBe("prisma");

    expect(prismaModule).toHaveBeenCalledTimes(1);
    expect(jsonModule).not.toHaveBeenCalled();
  });
});

