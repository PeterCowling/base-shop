// packages/platform-core/__tests__/repoResolver.test.ts
import { resolveRepo } from "../src/repositories/repoResolver";

describe("resolveRepo", () => {
  const prismaDelegate = jest.fn();
  const prismaModule = jest.fn<Promise<string>, []>(() => Promise.resolve("prisma"));
  const jsonModule = jest.fn<Promise<string>, []>(() => Promise.resolve("json"));
  const sqliteModule = jest.fn<Promise<string>, []>(() => Promise.resolve("sqlite"));

  afterEach(() => {
    delete process.env.INVENTORY_BACKEND;
    delete process.env.DATABASE_URL;
    jest.clearAllMocks();
  });

  it("uses sqlite module when INVENTORY_BACKEND=sqlite", async () => {
    process.env.INVENTORY_BACKEND = "sqlite";

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
        sqliteModule,
      }),
    ).resolves.toBe("sqlite");

    expect(sqliteModule).toHaveBeenCalledTimes(1);
    expect(jsonModule).not.toHaveBeenCalled();
    expect(prismaModule).not.toHaveBeenCalled();
  });

  it("uses json module when INVENTORY_BACKEND=json", async () => {
    process.env.INVENTORY_BACKEND = "json";

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
        sqliteModule,
      }),
    ).resolves.toBe("json");

    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
    expect(sqliteModule).not.toHaveBeenCalled();
  });

  it("uses prisma module when DATABASE_URL is set and delegate returns truthy", async () => {
    process.env.DATABASE_URL = "postgres://example";
    prismaDelegate.mockReturnValue({});

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
        sqliteModule,
      }),
    ).resolves.toBe("prisma");

    expect(prismaModule).toHaveBeenCalledTimes(1);
    expect(jsonModule).not.toHaveBeenCalled();
    expect(sqliteModule).not.toHaveBeenCalled();
  });

  it("falls back to json module when delegate throws", async () => {
    process.env.DATABASE_URL = "postgres://example";
    prismaDelegate.mockImplementation(() => {
      throw new Error("fail");
    });

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
        sqliteModule,
      }),
    ).resolves.toBe("json");

    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
    expect(sqliteModule).not.toHaveBeenCalled();
  });

  it("falls back to json module when delegate returns falsy", async () => {
    process.env.DATABASE_URL = "postgres://example";
    prismaDelegate.mockReturnValue(undefined);

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
        sqliteModule,
      }),
    ).resolves.toBe("json");

    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
    expect(sqliteModule).not.toHaveBeenCalled();
  });
});

