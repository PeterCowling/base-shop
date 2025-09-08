import { jest } from "@jest/globals";

let prismaImportCount = 0;
let jsonImportCount = 0;

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

jest.mock("../pages.prisma.server", () => {
  prismaImportCount++;
  return mockPrisma;
});

jest.mock("../pages.json.server", () => {
  jsonImportCount++;
  return mockJson;
});

jest.mock("../../../db", () => ({ prisma: { page: {} } }));

const resolveRepoMock = jest.fn(
  async (
    _delegate: any,
    prismaModule: any,
    jsonModule: any,
  ) => {
    if (process.env.INVENTORY_BACKEND === "json") {
      return await jsonModule();
    }
    return await prismaModule();
  },
);

jest.mock("../repoResolver", () => ({ resolveRepo: resolveRepoMock }));

describe("pages repository backend selection", () => {
  const origBackend = process.env.INVENTORY_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    jsonImportCount = 0;
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.INVENTORY_BACKEND;
    } else {
      process.env.INVENTORY_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it("uses Prisma backend by default", async () => {
    delete process.env.INVENTORY_BACKEND;
    const repo = await import("../index.server");

    await repo.getPages("shop1");
    await repo.getPages("shop2");

    expect(prismaImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
    expect(mockPrisma.getPages).toHaveBeenCalledTimes(2);
    expect(resolveRepoMock).toHaveBeenCalledTimes(1);
  });

  it("uses JSON backend when INVENTORY_BACKEND=json", async () => {
    process.env.INVENTORY_BACKEND = "json";
    const repo = await import("../index.server");

    await repo.getPages("shop1");
    await repo.getPages("shop2");

    expect(jsonImportCount).toBe(1);
    expect(prismaImportCount).toBe(0);
    expect(mockJson.getPages).toHaveBeenCalledTimes(2);
    expect(resolveRepoMock).toHaveBeenCalledTimes(1);
  });
});
