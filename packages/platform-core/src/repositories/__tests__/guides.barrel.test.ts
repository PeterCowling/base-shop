describe("json.server guides exports", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.GUIDES_BACKEND;
    delete process.env.DB_MODE;
    delete process.env.DATABASE_URL;
  });

  it("exports readGuideRepo from the JSON barrel", async () => {
    const mod = await import("../json.server");
    expect(typeof mod.readGuideRepo).toBe("function");
  });

  it("lazy-loads guides backend on first readGuideRepo call", async () => {
    await jest.isolateModulesAsync(async () => {
      let jsonBackendLoaded = false;
      jest.doMock("../guides.json.server", () => {
        jsonBackendLoaded = true;
        return {
          jsonGuidesRepository: {
            read: jest.fn().mockResolvedValue([]),
            write: jest.fn(),
            getById: jest.fn(),
            getByKey: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            duplicate: jest.fn(),
            getContent: jest.fn(),
            writeContent: jest.fn(),
          },
        };
      });

      const { readGuideRepo } = await import("../json.server");
      expect(jsonBackendLoaded).toBe(false);
      await readGuideRepo("demo");
      expect(jsonBackendLoaded).toBe(true);
    });
  });
});
