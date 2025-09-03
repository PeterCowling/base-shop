import path from "node:path";
import { DATA_ROOT } from "@platform-core/dataRoot";

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

jest.mock("@acme/lib", () => ({ validateShopName: (s: string) => s }));

describe("readSegments", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns empty array when JSON is an object", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ foo: 1 }));
    const { readSegments } = await import("../segments");
    await expect(readSegments("shop1")).resolves.toEqual([]);
  });
});

describe("provider functions", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.EMAIL_PROVIDER;
  });

  it("return safe defaults when EMAIL_PROVIDER is unset", async () => {
    const { createContact, addToList, listSegments } = await import(
      "../segments"
    );
    await expect(createContact("a@example.com")).resolves.toBe("");
    await expect(addToList("c1", "l1")).resolves.toBeUndefined();
    await expect(listSegments()).resolves.toEqual([]);
  });

  it("delegates to configured provider", async () => {
    const createContactImpl = jest.fn().mockResolvedValue("contact-1");
    const addToListImpl = jest.fn().mockResolvedValue(undefined);
    const listSegmentsImpl = jest
      .fn()
      .mockResolvedValue([{ id: "s1", name: "All" }]);

    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: class {
        createContact = createContactImpl;
        addToList = addToListImpl;
        listSegments = listSegmentsImpl;
      },
    }));

    process.env.EMAIL_PROVIDER = "sendgrid";
    const { createContact, addToList, listSegments } = await import(
      "../segments"
    );

    const id = await createContact("user@example.com");
    await addToList(id, "list1");
    const segments = await listSegments();

    expect(id).toBe("contact-1");
    expect(createContactImpl).toHaveBeenCalledWith("user@example.com");
    expect(addToListImpl).toHaveBeenCalledWith("contact-1", "list1");
    expect(segments).toEqual([{ id: "s1", name: "All" }]);
  });

  it("returns empty list for unknown provider", async () => {
    process.env.EMAIL_PROVIDER = "unknown";
    const { listSegments } = await import("../segments");
    await expect(listSegments()).resolves.toEqual([]);
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

describe("resolveSegment events", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("resolves emails from segment events when no definition exists", async () => {
    mockReadFile.mockResolvedValue("[]");
    mockStat.mockResolvedValue({ mtimeMs: 1 });
    mockListEvents.mockResolvedValue([
      { email: "a@example.com", type: "segment", segment: "vip" },
      { email: "b@example.com", type: "segment:vip" },
      { email: "c@example.com", type: "segment", segment: "other" },
      { email: "d@example.com", type: "segment:other" },
    ]);

    const { resolveSegment } = await import("../segments");
    const result = await resolveSegment("shop1", "vip");
    expect(result.sort()).toEqual(["a@example.com", "b@example.com"].sort());
  });

  it("caches resolved emails for segment events", async () => {
    process.env.SEGMENT_CACHE_TTL = "1000";
    mockReadFile.mockResolvedValue("[]");
    mockStat.mockResolvedValue({ mtimeMs: 1 });
    mockListEvents.mockResolvedValue([
      { email: "a@example.com", type: "segment:vip" },
    ]);

    const { resolveSegment } = await import("../segments");
    const r1 = await resolveSegment("shop1", "vip");
    const r2 = await resolveSegment("shop1", "vip");

    expect(r1).toEqual(["a@example.com"]);
    expect(r2).toEqual(["a@example.com"]);
    expect(mockListEvents).toHaveBeenCalledTimes(1);
    delete process.env.SEGMENT_CACHE_TTL;
  });
});

describe("analyticsMTime", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.unmock("fs");
  });

  it("returns 0 when analytics file is missing", async () => {
    const { analyticsMTime } = await import("../segments");
    await expect(analyticsMTime("missing-shop")).resolves.toBe(0);
  });

  it("returns file mtime when analytics file exists", async () => {
    const shop = `test-shop-${Date.now()}`;
    const { promises: fs } = await import("node:fs");
    const dir = path.join(DATA_ROOT, shop);
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, "analytics.jsonl");
    await fs.writeFile(file, "");
    const stat = await fs.stat(file);

    const { analyticsMTime } = await import("../segments");
    await expect(analyticsMTime(shop)).resolves.toBe(stat.mtimeMs);

    await fs.rm(dir, { recursive: true, force: true });
  });
});

