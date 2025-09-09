import { jest } from "@jest/globals";

const mockJson = {
  readSeoAudits: jest.fn(),
  appendSeoAudit: jest.fn(),
};

const mockPrisma = {
  readSeoAudits: jest.fn(),
  appendSeoAudit: jest.fn(),
};

let prismaImportCount = 0;

jest.mock(
  "../packages/platform-core/src/repositories/seoAudit.json.server",
  () => mockJson,
);

jest.mock(
  "../packages/platform-core/src/repositories/seoAudit.prisma.server",
  () => {
    prismaImportCount++;
    return mockPrisma;
  },
);

jest.mock("../packages/platform-core/src/db", () => ({
  prisma: { seoAudit: {} },
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

describe("seoAudit repository backend selection", () => {
  const origBackend = process.env.SEO_AUDIT_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.SEO_AUDIT_BACKEND;
    } else {
      process.env.SEO_AUDIT_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when SEO_AUDIT_BACKEND="json"', async () => {
    process.env.SEO_AUDIT_BACKEND = "json";
    const repo = await import(
      "../packages/platform-core/src/repositories/seoAudit.server"
    );

    await repo.readSeoAudits("shop");
    await repo.appendSeoAudit("shop", { timestamp: "now", score: 1 });

    expect(mockJson.readSeoAudits).toHaveBeenCalledWith("shop");
    expect(mockJson.appendSeoAudit).toHaveBeenCalledWith("shop", { timestamp: "now", score: 1 });
    expect(mockPrisma.readSeoAudits).not.toHaveBeenCalled();
  });

  it("defaults to the Prisma repository when SEO_AUDIT_BACKEND is not set", async () => {
    delete process.env.SEO_AUDIT_BACKEND;
    const repo = await import(
      "../packages/platform-core/src/repositories/seoAudit.server"
    );

    await repo.readSeoAudits("shop");
    await repo.appendSeoAudit("shop", { timestamp: "now", score: 1 });

    expect(mockPrisma.readSeoAudits).toHaveBeenCalledWith("shop");
    expect(mockPrisma.appendSeoAudit).toHaveBeenCalledWith("shop", { timestamp: "now", score: 1 });
    expect(mockJson.readSeoAudits).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});
