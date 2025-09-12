import { resolveRepo } from "../repoResolver";

describe("resolveRepo", () => {
  afterEach(() => {
    delete process.env.TEST_BACKEND;
    delete process.env.DATABASE_URL;
    delete process.env.DB_MODE;
    delete process.env.INVENTORY_BACKEND;
    jest.clearAllMocks();
  });

  it("loads JSON module when backendEnvVar is json", async () => {
    process.env.TEST_BACKEND = "json";

    const prismaModule = jest.fn();
    const jsonModule = jest.fn<Promise<string>, []>(() => Promise.resolve("json"));

    const result = await resolveRepo(() => undefined, prismaModule, jsonModule, {
      backendEnvVar: "TEST_BACKEND",
    });

    expect(result).toBe("json");
    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
  });

  it("loads JSON module when DB_MODE is json", async () => {
    process.env.DB_MODE = "json";

    const prismaModule = jest.fn();
    const jsonModule = jest.fn<Promise<string>, []>(() => Promise.resolve("json"));

    const result = await resolveRepo(() => undefined, prismaModule, jsonModule);

    expect(result).toBe("json");
    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
  });

  it("returns Prisma module when DATABASE_URL is set and delegate is truthy", async () => {
    process.env.DATABASE_URL = "postgres://example";

    const prismaDelegate = jest.fn(() => ({}));
    const prismaModule = jest.fn<Promise<string>, []>(() => Promise.resolve("prisma"));
    const jsonModule = jest.fn();

    const result = await resolveRepo(prismaDelegate, prismaModule, jsonModule, {
      backendEnvVar: "TEST_BACKEND",
    });

    expect(result).toBe("prisma");
    expect(prismaModule).toHaveBeenCalledTimes(1);
    expect(jsonModule).not.toHaveBeenCalled();
  });

  it("falls back to JSON when delegate returns undefined", async () => {
    process.env.DATABASE_URL = "postgres://example";

    const prismaDelegate = jest.fn(() => undefined);
    const prismaModule = jest.fn();
    const jsonModule = jest.fn<Promise<string>, []>(() => Promise.resolve("json"));

    const result = await resolveRepo(prismaDelegate, prismaModule, jsonModule, {
      backendEnvVar: "TEST_BACKEND",
    });

    expect(result).toBe("json");
    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
    expect(prismaDelegate).toHaveBeenCalledTimes(1);
  });

  it("falls back to JSON when delegate throws", async () => {
    process.env.DATABASE_URL = "postgres://example";

    const prismaDelegate = jest.fn(() => {
      throw new Error("fail");
    });
    const prismaModule = jest.fn();
    const jsonModule = jest.fn<Promise<string>, []>(() => Promise.resolve("json"));

    const result = await resolveRepo(prismaDelegate, prismaModule, jsonModule, {
      backendEnvVar: "TEST_BACKEND",
    });

    expect(result).toBe("json");
    expect(jsonModule).toHaveBeenCalledTimes(1);
    expect(prismaModule).not.toHaveBeenCalled();
    expect(prismaDelegate).toHaveBeenCalledTimes(1);
  });
});
