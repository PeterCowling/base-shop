const listEventsMock = jest.fn();
const statMock = jest.fn();
const readFileMock = jest.fn();

jest.mock("@acme/platform-core/repositories/analytics.server", () => ({
  listEvents: (...args: unknown[]) => listEventsMock(...args),
}));

jest.mock("node:fs", () => ({
  ...jest.requireActual("node:fs"),
  promises: {
    readFile: (...args: unknown[]) => readFileMock(...args),
    stat: (...args: unknown[]) => statMock(...args),
  },
}));

jest.mock("../providers/sendgrid", () => ({
  SendgridProvider: class {},
}));

jest.mock("../providers/resend", () => ({
  ResendProvider: class {},
}));

describe("resolveSegment caching", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns cached result on repeated calls", async () => {
    process.env.SEGMENT_CACHE_TTL = "1000";
    readFileMock.mockResolvedValue(
      JSON.stringify([{ id: "vips", filters: [] }])
    );
    statMock.mockResolvedValue({ mtimeMs: 1 });
    listEventsMock.mockResolvedValue([{ email: "a@example.com" }]);
    const { resolveSegment } = await import("../segments");

    const r1 = await resolveSegment("shop1", "vips");
    const r2 = await resolveSegment("shop1", "vips");

    expect(r1).toEqual(["a@example.com"]);
    expect(r2).toEqual(["a@example.com"]);
    expect(listEventsMock).toHaveBeenCalledTimes(1);
  });

  it("invalidates cache when analytics events change", async () => {
    process.env.SEGMENT_CACHE_TTL = "1000";
    readFileMock.mockResolvedValue(
      JSON.stringify([{ id: "vips", filters: [] }])
    );
    statMock
      .mockResolvedValueOnce({ mtimeMs: 1 })
      .mockResolvedValueOnce({ mtimeMs: 2 });
    listEventsMock
      .mockResolvedValueOnce([{ email: "a@example.com" }])
      .mockResolvedValueOnce([{ email: "b@example.com" }]);

    const { resolveSegment } = await import("../segments");

    const r1 = await resolveSegment("shop1", "vips");
    const r2 = await resolveSegment("shop1", "vips");

    expect(r1).toEqual(["a@example.com"]);
    expect(r2).toEqual(["b@example.com"]);
    expect(listEventsMock).toHaveBeenCalledTimes(2);
  });
});

