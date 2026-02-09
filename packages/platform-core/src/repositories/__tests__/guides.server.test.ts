import { jest } from "@jest/globals";

function createRepoStub() {
  return {
    read: jest.fn().mockResolvedValue([]),
    write: jest.fn().mockResolvedValue(undefined),
    getById: jest.fn().mockResolvedValue(null),
    getByKey: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: "g1", row_version: 2 }),
    delete: jest.fn().mockResolvedValue(undefined),
    duplicate: jest.fn().mockResolvedValue({ id: "copy" }),
    getContent: jest.fn().mockResolvedValue(null),
    writeContent: jest.fn().mockResolvedValue(undefined),
  };
}

describe("guides.server delegation", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.GUIDES_BACKEND;
    delete process.env.DB_MODE;
    delete process.env.DATABASE_URL;
  });

  it("readGuideRepo delegates to repository read()", async () => {
    const repo = createRepoStub();
    const resolveRepo = jest.fn().mockResolvedValue(repo);
    jest.doMock("../repoResolver", () => ({ resolveRepo }));

    const { readGuideRepo } = await import("../guides.server");
    await readGuideRepo("demo");

    expect(repo.read).toHaveBeenCalledWith("demo");
  });

  it("getGuideByKey delegates to repository getByKey()", async () => {
    const repo = createRepoStub();
    const resolveRepo = jest.fn().mockResolvedValue(repo);
    jest.doMock("../repoResolver", () => ({ resolveRepo }));

    const { getGuideByKey } = await import("../guides.server");
    await getGuideByKey("demo", "positanoGuide");

    expect(repo.getByKey).toHaveBeenCalledWith("demo", "positanoGuide");
  });

  it("updateGuideInRepo delegates to repository update()", async () => {
    const repo = createRepoStub();
    const resolveRepo = jest.fn().mockResolvedValue(repo);
    jest.doMock("../repoResolver", () => ({ resolveRepo }));

    const { updateGuideInRepo } = await import("../guides.server");
    await updateGuideInRepo("demo", { id: "g1", status: "review" } as never);

    expect(repo.update).toHaveBeenCalledWith("demo", {
      id: "g1",
      status: "review",
    });
  });

  it("reuses repoPromise singleton across calls", async () => {
    const repo = createRepoStub();
    const resolveRepo = jest.fn().mockResolvedValue(repo);
    jest.doMock("../repoResolver", () => ({ resolveRepo }));

    const { readGuideRepo,writeGuideRepo } = await import("../guides.server");
    await readGuideRepo("demo");
    await writeGuideRepo("demo", []);

    expect(resolveRepo).toHaveBeenCalledTimes(1);
    expect(resolveRepo).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      { backendEnvVar: "GUIDES_BACKEND" },
    );
  });
});

describe("guides.server backend selection", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.dontMock("../repoResolver");
    jest.unmock("../repoResolver");
    delete process.env.DATABASE_URL;
    delete process.env.DB_MODE;
  });

  it("uses JSON backend when GUIDES_BACKEND=json", async () => {
    process.env.GUIDES_BACKEND = "json";
    const jsonRepo = createRepoStub();
    const prismaRepo = createRepoStub();
    jsonRepo.read.mockResolvedValue([{ id: "json-guide" }]);

    jest.doMock("../guides.json.server", () => ({ jsonGuidesRepository: jsonRepo }));
    jest.doMock("../guides.prisma.server", () => ({ prismaGuidesRepository: prismaRepo }));

    const { readGuideRepo } = await import("../guides.server");
    await expect(readGuideRepo("demo")).resolves.toEqual([{ id: "json-guide" }]);
    expect(jsonRepo.read).toHaveBeenCalledWith("demo");
    expect(prismaRepo.read).not.toHaveBeenCalled();
  });

  it("falls back to JSON backend when no backend env var is set", async () => {
    delete process.env.GUIDES_BACKEND;
    const jsonRepo = createRepoStub();
    const prismaRepo = createRepoStub();
    jsonRepo.read.mockResolvedValue([{ id: "fallback-guide" }]);

    jest.doMock("../guides.json.server", () => ({ jsonGuidesRepository: jsonRepo }));
    jest.doMock("../guides.prisma.server", () => ({ prismaGuidesRepository: prismaRepo }));

    const { readGuideRepo } = await import("../guides.server");
    await expect(readGuideRepo("demo")).resolves.toEqual([{ id: "fallback-guide" }]);
    expect(jsonRepo.read).toHaveBeenCalledWith("demo");
    expect(prismaRepo.read).not.toHaveBeenCalled();
  });
});
