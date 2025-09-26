import { jest } from "@jest/globals";

let prismaImportCount = 0;
let jsonImportCount = 0;

const mockPrisma = {
  getSections: jest.fn(),
  saveSection: jest.fn(),
  deleteSection: jest.fn(),
  updateSection: jest.fn(),
};

const mockJson = {
  getSections: jest.fn(),
  saveSection: jest.fn(),
  deleteSection: jest.fn(),
  updateSection: jest.fn(),
};

jest.mock("../sections.prisma.server", () => {
  prismaImportCount++;
  return mockPrisma;
});

jest.mock("../sections.json.server", () => {
  jsonImportCount++;
  return mockJson;
});

jest.mock("../../../db", () => ({
  prisma: { sectionTemplate: {} },
}));

const resolveRepoMock = jest.fn(
  async (
    _delegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any = {},
  ) => {
    const envVar = options.backendEnvVar ?? "SECTIONS_BACKEND";
    if (process.env[envVar] === "json") {
      return await jsonModule();
    }
    return await prismaModule();
  },
);

jest.mock("../../repoResolver", () => ({ resolveRepo: resolveRepoMock }));

describe("sections repository backend selection", () => {
  const origBackend = process.env.SECTIONS_BACKEND;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    jsonImportCount = 0;
  });

  afterEach(() => {
    if (origBackend === undefined) delete process.env.SECTIONS_BACKEND;
    else process.env.SECTIONS_BACKEND = origBackend;
  });

  it("uses Prisma backend by default", async () => {
    delete process.env.SECTIONS_BACKEND;
    const repo = await import("../index.server");
    await repo.getSections("shop1");
    expect(prismaImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
    expect(mockPrisma.getSections).toHaveBeenCalledTimes(1);
    expect(resolveRepoMock).toHaveBeenCalledTimes(1);
  });

  it("uses JSON backend when SECTIONS_BACKEND=json", async () => {
    process.env.SECTIONS_BACKEND = "json";
    const repo = await import("../index.server");
    await repo.getSections("shop1");
    await repo.getSections("shop2");
    expect(jsonImportCount).toBe(1);
    expect(prismaImportCount).toBe(0);
    expect(mockJson.getSections).toHaveBeenCalledTimes(2);
    expect(resolveRepoMock).toHaveBeenCalledTimes(1);
  });
});

