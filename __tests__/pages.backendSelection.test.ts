import { jest } from "@jest/globals";

const mockJson = {
  getPages: jest.fn(),
  savePage: jest.fn(),
  deletePage: jest.fn(),
  updatePage: jest.fn(),
  diffHistory: jest.fn(),
};

const mockPrisma = {
  getPages: jest.fn(),
  savePage: jest.fn(),
  deletePage: jest.fn(),
  updatePage: jest.fn(),
  diffHistory: jest.fn(),
};

let prismaImportCount = 0;

jest.mock(
  "../packages/platform-core/src/repositories/pages/pages.json.server",
  () => mockJson,
);

jest.mock(
  "../packages/platform-core/src/repositories/pages/pages.prisma.server",
  () => {
    prismaImportCount++;
    return mockPrisma;
  },
);

jest.mock("../packages/platform-core/src/db", () => ({
  prisma: { page: {} },
}));

jest.mock("../packages/platform-core/src/repositories/repoResolver", () => ({
  resolveRepo: async (
    prismaDelegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any,
  ) => {
    const backend = process.env[options.backendEnvVar];
    if (backend === "json") {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe("pages repository backend selection", () => {
  const origBackend = process.env.PAGES_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.PAGES_BACKEND;
    } else {
      process.env.PAGES_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when PAGES_BACKEND="json"', async () => {
    process.env.PAGES_BACKEND = "json";
    const repo = await import(
      "../packages/platform-core/src/repositories/pages/index.server"
    );

    await repo.getPages("shop");
    await repo.savePage("shop", { id: "1" } as any);
    await repo.deletePage("shop", "1");
    await repo.updatePage("shop", { id: "1", updatedAt: "now" } as any, {} as any);
    await repo.diffHistory("shop");

    expect(mockJson.getPages).toHaveBeenCalledWith("shop");
    expect(mockJson.savePage).toHaveBeenCalledWith("shop", { id: "1" }, undefined);
    expect(mockJson.deletePage).toHaveBeenCalledWith("shop", "1");
    expect(mockJson.updatePage).toHaveBeenCalledWith(
      "shop",
      { id: "1", updatedAt: "now" },
      {},
    );
    expect(mockJson.diffHistory).toHaveBeenCalledWith("shop");
    expect(mockPrisma.getPages).not.toHaveBeenCalled();
  });

  it("defaults to the Prisma repository when PAGES_BACKEND is not set", async () => {
    delete process.env.PAGES_BACKEND;
    const repo = await import(
      "../packages/platform-core/src/repositories/pages/index.server"
    );

    await repo.getPages("shop");
    await repo.savePage("shop", { id: "1" } as any);
    await repo.deletePage("shop", "1");
    await repo.updatePage("shop", { id: "1", updatedAt: "now" } as any, {} as any);
    await repo.diffHistory("shop");

    expect(mockPrisma.getPages).toHaveBeenCalledWith("shop");
    expect(mockPrisma.savePage).toHaveBeenCalledWith(
      "shop",
      { id: "1" },
      undefined,
    );
    expect(mockPrisma.deletePage).toHaveBeenCalledWith("shop", "1");
    expect(mockPrisma.updatePage).toHaveBeenCalledWith(
      "shop",
      { id: "1", updatedAt: "now" },
      {},
    );
    expect(mockPrisma.diffHistory).toHaveBeenCalledWith("shop");
    expect(mockJson.getPages).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});

