import { jest } from "@jest/globals";

let prismaImportCount = 0;
let jsonImportCount = 0;
let inventoryPrismaImportCount = 0;
let inventoryJsonImportCount = 0;

const mockPrisma = {
  getPages: jest.fn(),
  savePage: jest.fn(),
  deletePage: jest.fn(),
  updatePage: jest.fn(),
  diffHistory: jest.fn(),
};

const mockJson = {
  getPages: jest.fn(),
  savePage: jest.fn(),
  deletePage: jest.fn(),
  updatePage: jest.fn(),
  diffHistory: jest.fn(),
};

const mockInventoryPrisma = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
};

const mockInventoryJson = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
};

jest.mock("../pages.prisma.server", () => {
  prismaImportCount++;
  return mockPrisma;
});

jest.mock("../pages.json.server", () => {
  jsonImportCount++;
  return mockJson;
});

jest.mock("../../inventory.prisma.server", () => {
  inventoryPrismaImportCount++;
  return { prismaInventoryRepository: mockInventoryPrisma };
});

jest.mock("../../inventory.json.server", () => {
  inventoryJsonImportCount++;
  return { jsonInventoryRepository: mockInventoryJson };
});

jest.mock("../../../db", () => ({
  prisma: { page: {}, inventoryItem: {} },
}));

const resolveRepoMock = jest.fn(
  async (
    _delegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any = {},
  ) => {
    const envVar = options.backendEnvVar ?? "INVENTORY_BACKEND";
    if (process.env[envVar] === "json") {
      return await jsonModule();
    }
    return await prismaModule();
  },
);

jest.mock("../../repoResolver", () => ({ resolveRepo: resolveRepoMock }));

describe("pages repository backend selection", () => {
  const origInventoryBackend = process.env.INVENTORY_BACKEND;
  const origPagesBackend = process.env.PAGES_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    jsonImportCount = 0;
    inventoryPrismaImportCount = 0;
    inventoryJsonImportCount = 0;
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origInventoryBackend === undefined) {
      delete process.env.INVENTORY_BACKEND;
    } else {
      process.env.INVENTORY_BACKEND = origInventoryBackend;
    }
    if (origPagesBackend === undefined) {
      delete process.env.PAGES_BACKEND;
    } else {
      process.env.PAGES_BACKEND = origPagesBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it("uses Prisma backend by default", async () => {
    delete process.env.PAGES_BACKEND;
    const repo = await import("../index.server");

    await repo.getPages("shop1");
    await repo.getPages("shop2");

    expect(prismaImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
    expect(mockPrisma.getPages).toHaveBeenCalledTimes(2);
    expect(resolveRepoMock).toHaveBeenCalledTimes(1);
  });

  it("uses JSON backend when PAGES_BACKEND=json", async () => {
    process.env.PAGES_BACKEND = "json";
    const repo = await import("../index.server");

    await repo.getPages("shop1");
    await repo.getPages("shop2");

    expect(jsonImportCount).toBe(1);
    expect(prismaImportCount).toBe(0);
    expect(mockJson.getPages).toHaveBeenCalledTimes(2);
    expect(resolveRepoMock).toHaveBeenCalledTimes(1);
  });

  it("PAGES_BACKEND=json switches only pages repo while inventory uses Prisma", async () => {
    delete process.env.INVENTORY_BACKEND;
    process.env.PAGES_BACKEND = "json";

    const pagesRepo = await import("../index.server");
    await pagesRepo.getPages("shop1");

    const { inventoryRepository } = await import("../../inventory.server");
    await inventoryRepository.read("shop1");

    expect(jsonImportCount).toBe(1);
    expect(prismaImportCount).toBe(0);
    expect(inventoryPrismaImportCount).toBe(1);
    expect(inventoryJsonImportCount).toBe(0);
  });

  it("ignores INVENTORY_BACKEND=sqlite and uses Prisma by default", async () => {
    process.env.INVENTORY_BACKEND = "sqlite";
    delete process.env.PAGES_BACKEND;

    const repo = await import("../index.server");

    await repo.getPages("shop1");

    expect(prismaImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
  });

  it("uses JSON backend when PAGES_BACKEND=json even if INVENTORY_BACKEND=sqlite", async () => {
    process.env.INVENTORY_BACKEND = "sqlite";
    process.env.PAGES_BACKEND = "json";

    const repo = await import("../index.server");

    await repo.getPages("shop1");

    expect(jsonImportCount).toBe(1);
    expect(prismaImportCount).toBe(0);
  });
});
