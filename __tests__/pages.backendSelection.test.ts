import { jest } from "@jest/globals";

let prismaImportCount = 0;
let jsonImportCount = 0;
const mockPrisma = { getPages: jest.fn() };
const mockJson = { getPages: jest.fn() };

jest.mock("../packages/platform-core/src/repositories/pages/pages.prisma.server", () => {
  prismaImportCount++;
  return mockPrisma;
});

jest.mock("../packages/platform-core/src/repositories/pages/pages.json.server", () => {
  jsonImportCount++;
  return mockJson;
});

jest.mock("../packages/platform-core/src/db", () => ({ prisma: { page: {} } }));

describe("PAGES_BACKEND environment variable", () => {
  const origBackend = process.env.PAGES_BACKEND;
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

  it("uses Prisma backend by default", async () => {
    delete process.env.PAGES_BACKEND;
    const repo = await import("../packages/platform-core/src/repositories/pages/index.server");
    await repo.getPages("shop1");
    expect(prismaImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
    expect(mockPrisma.getPages).toHaveBeenCalledTimes(1);
  });

  it("uses JSON backend when PAGES_BACKEND=json", async () => {
    process.env.PAGES_BACKEND = "json";
    const repo = await import("../packages/platform-core/src/repositories/pages/index.server");
    await repo.getPages("shop1");
    expect(jsonImportCount).toBe(1);
    expect(prismaImportCount).toBe(0);
    expect(mockJson.getPages).toHaveBeenCalledTimes(1);
  });
});
