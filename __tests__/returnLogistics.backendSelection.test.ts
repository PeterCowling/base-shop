import { jest } from "@jest/globals";

const mockJson = {
  readReturnLogistics: jest.fn(),
  writeReturnLogistics: jest.fn(),
};

const mockPrisma = {
  readReturnLogistics: jest.fn(),
  writeReturnLogistics: jest.fn(),
};

let prismaImportCount = 0;

jest.mock(
  "../packages/platform-core/src/repositories/returnLogistics.json.server",
  () => ({ jsonReturnLogisticsRepository: mockJson })
);

jest.mock(
  "../packages/platform-core/src/repositories/returnLogistics.prisma.server",
  () => {
    prismaImportCount++;
    return { prismaReturnLogisticsRepository: mockPrisma };
  }
);

jest.mock("../packages/platform-core/src/db", () => ({
  prisma: { returnLogistics: {} },
}));

jest.mock("../packages/platform-core/src/repositories/repoResolver", () => ({
  resolveRepo: async (
    prismaDelegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any
  ) => {
    const backend = process.env[options.backendEnvVar];
    if (backend === "json") {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe("return logistics repository backend selection", () => {
  const origBackend = process.env.RETURN_LOGISTICS_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.RETURN_LOGISTICS_BACKEND;
    } else {
      process.env.RETURN_LOGISTICS_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when RETURN_LOGISTICS_BACKEND="json"', async () => {
    process.env.RETURN_LOGISTICS_BACKEND = "json";
    const repo = await import(
      "../packages/platform-core/src/repositories/returnLogistics.server"
    );

    await repo.readReturnLogistics();
    await repo.writeReturnLogistics({} as any);

    expect(mockJson.readReturnLogistics).toHaveBeenCalled();
    expect(mockJson.writeReturnLogistics).toHaveBeenCalled();
    expect(mockPrisma.readReturnLogistics).not.toHaveBeenCalled();
  });

  it("defaults to the Prisma repository when RETURN_LOGISTICS_BACKEND is not set", async () => {
    delete process.env.RETURN_LOGISTICS_BACKEND;
    const repo = await import(
      "../packages/platform-core/src/repositories/returnLogistics.server"
    );

    await repo.readReturnLogistics();
    await repo.writeReturnLogistics({} as any);

    expect(mockPrisma.readReturnLogistics).toHaveBeenCalled();
    expect(mockPrisma.writeReturnLogistics).toHaveBeenCalled();
    expect(mockJson.readReturnLogistics).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });

});
