const mockListEvents = jest.fn();
const mockStat = jest.fn();
const mockReadFile = jest.fn();

jest.mock("@platform-core/repositories/analytics.server", () => ({
  listEvents: (...args: unknown[]) => mockListEvents(...args),
}));

jest.mock("fs", () => ({
  ...jest.requireActual("node:fs"),
  promises: {
    readFile: (...args: unknown[]) => mockReadFile(...args),
    stat: (...args: unknown[]) => mockStat(...args),
  },
}));

jest.mock("../providers/sendgrid", () => ({
  SendgridProvider: class {},
}));

jest.mock("../providers/resend", () => ({
  ResendProvider: class {},
}));

const coreEnv: Record<string, any> = {};
jest.mock("@acme/config/env/core", () => ({ coreEnv }));
jest.mock("@acme/lib", () => ({ validateShopName: (s: string) => s }));

describe("listSegments", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns empty list for unknown provider", async () => {
    coreEnv.EMAIL_PROVIDER = "unknown";
    const { listSegments } = await import("../segments");
    await expect(listSegments()).resolves.toEqual([]);
    delete coreEnv.EMAIL_PROVIDER;
  });
});

describe("resolveSegment filters", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("ignores events without matching filter fields", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify([
        { id: "vips", filters: [{ field: "plan", value: "gold" }] },
      ])
    );
    mockStat.mockResolvedValue({ mtimeMs: 1 });
    mockListEvents.mockResolvedValue([
      { email: "a@example.com", plan: "silver" },
      { email: "b@example.com" },
    ]);

    const { resolveSegment } = await import("../segments");
    const result = await resolveSegment("shop1", "vips");
    expect(result).toEqual([]);
  });
});

describe("resolveSegment caching", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns cached result on repeated calls", async () => {
    process.env.SEGMENT_CACHE_TTL = "1000";
    mockReadFile.mockResolvedValue(
      JSON.stringify([{ id: "vips", filters: [] }])
    );
    mockStat.mockResolvedValue({ mtimeMs: 1 });
    mockListEvents.mockResolvedValue([{ email: "a@example.com" }]);
    const { resolveSegment } = await import("../segments");

    const r1 = await resolveSegment("shop1", "vips");
    const r2 = await resolveSegment("shop1", "vips");

    expect(r1).toEqual(["a@example.com"]);
    expect(r2).toEqual(["a@example.com"]);
    expect(mockListEvents).toHaveBeenCalledTimes(1);
  });

  it("invalidates cache when analytics events change", async () => {
    process.env.SEGMENT_CACHE_TTL = "1000";
    mockReadFile.mockResolvedValue(
      JSON.stringify([{ id: "vips", filters: [] }])
    );
    mockStat
      .mockResolvedValueOnce({ mtimeMs: 1 })
      .mockResolvedValueOnce({ mtimeMs: 2 });
    mockListEvents
      .mockResolvedValueOnce([{ email: "a@example.com" }])
      .mockResolvedValueOnce([{ email: "b@example.com" }]);

    const { resolveSegment } = await import("../segments");

    const r1 = await resolveSegment("shop1", "vips");
    const r2 = await resolveSegment("shop1", "vips");

    expect(r1).toEqual(["a@example.com"]);
    expect(r2).toEqual(["b@example.com"]);
    expect(mockListEvents).toHaveBeenCalledTimes(2);
  });
});

