// packages/platform-core/__tests__/repoResolver.test.ts
import { resolveRepo } from "../src/repositories/repoResolver";

describe("resolveRepo", () => {
  const prismaDelegate = jest.fn();
  const prismaModule = jest.fn<Promise<string>, []>(() =>
    Promise.resolve("prisma"),
  );
  const jsonModule = jest.fn<Promise<string>, []>(() =>
    Promise.resolve("json"),
  );

  afterEach(() => {
    delete process.env.INVENTORY_BACKEND;
    delete process.env.SHOP_BACKEND;
    delete process.env.SETTINGS_BACKEND;
    delete process.env.DATABASE_URL;
    delete process.env.DB_MODE;
    jest.clearAllMocks();
  });

  it("uses json module when repo-specific backend is explicitly json", async () => {
    process.env.INVENTORY_BACKEND = "json";

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
      }),
    ).resolves.toBe("json");

    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
    expect(prismaDelegate).not.toHaveBeenCalled();
  });

  it("uses prisma module when repo-specific backend is explicitly prisma and configuration is valid", async () => {
    process.env.INVENTORY_BACKEND = "prisma";
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

  it("fails fast when repo-specific backend is prisma but DATABASE_URL is missing", async () => {
    process.env.INVENTORY_BACKEND = "prisma";
    prismaDelegate.mockReturnValue({});

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
      }),
    ).rejects.toThrow("DATABASE_URL");

    expect(prismaModule).not.toHaveBeenCalled();
    expect(jsonModule).not.toHaveBeenCalled();
  });

  it("fails fast when repo-specific backend is prisma but delegate is missing", async () => {
    process.env.SHOP_BACKEND = "prisma";
    process.env.DATABASE_URL = "postgres://example";
    prismaDelegate.mockReturnValue(undefined);

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "SHOP_BACKEND",
      }),
    ).rejects.toThrow("delegate");

    expect(prismaModule).not.toHaveBeenCalled();
    expect(jsonModule).not.toHaveBeenCalled();
  });

  it("fails fast when backend value is unsupported", async () => {
    process.env.SETTINGS_BACKEND = "mongo";

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "SETTINGS_BACKEND",
      }),
    ).rejects.toThrow(/Unsupported backend/);

    expect(prismaModule).not.toHaveBeenCalled();
    expect(jsonModule).not.toHaveBeenCalled();
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
    expect(prismaDelegate).not.toHaveBeenCalled();
  });

  it("honours DB_MODE=prisma when configuration is valid", async () => {
    process.env.DB_MODE = "prisma";
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

  it("falls back to json when neither backend var nor DB_MODE is set and Prisma is unavailable", async () => {
    process.env.DATABASE_URL = "";
    prismaDelegate.mockReturnValue(undefined);

    await expect(
      resolveRepo(prismaDelegate, prismaModule, jsonModule, {
        backendEnvVar: "INVENTORY_BACKEND",
      }),
    ).resolves.toBe("json");

    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
  });

  it("uses Prisma in legacy auto-detection mode when DATABASE_URL and delegate are present", async () => {
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

  it("falls back to json in legacy auto-detection mode when delegate throws", async () => {
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
});
