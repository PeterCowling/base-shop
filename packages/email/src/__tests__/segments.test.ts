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

jest.mock("@acme/lib", () => ({
  validateShopName: jest.fn((s: string) => s),
}));

let validateShopName: jest.Mock;

describe("readSegments", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    validateShopName = require("@acme/lib").validateShopName;
  });

  it("returns empty array when JSON is an object", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ foo: 1 }));
    const { readSegments } = await import("../segments");
    await expect(readSegments("shop1")).resolves.toEqual([]);
  });

  it("returns parsed array and validates shop name", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify([{ id: "s1", filters: [] }])
    );
    const { readSegments } = await import("../segments");
    const result = await readSegments("shop1");
    expect(result).toEqual([{ id: "s1", filters: [] }]);
    expect(validateShopName).toHaveBeenCalledWith("shop1");
  });

  it("returns empty array on invalid JSON", async () => {
    mockReadFile.mockResolvedValue("{not json}");
    const { readSegments } = await import("../segments");
    await expect(readSegments("shop1")).resolves.toEqual([]);
  });

  it("returns empty array when file is missing", async () => {
    const err = Object.assign(new Error("missing"), { code: "ENOENT" });
    mockReadFile.mockRejectedValue(err);
    const { readSegments } = await import("../segments");
    await expect(readSegments("shop1")).resolves.toEqual([]);
  });

  it("returns empty array when readFile fails", async () => {
    mockReadFile.mockRejectedValue(new Error("fail"));
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

  it("createContact returns empty string when EMAIL_PROVIDER is unset", async () => {
    const { createContact } = await import("../segments");
    await expect(createContact("a@example.com")).resolves.toBe("");
  });

  it("addToList resolves when EMAIL_PROVIDER is unset", async () => {
    const { addToList } = await import("../segments");
    await expect(addToList("c1", "l1")).resolves.toBeUndefined();
  });

  it("listSegments returns empty array when EMAIL_PROVIDER is unset", async () => {
    const { listSegments } = await import("../segments");
    await expect(listSegments()).resolves.toEqual([]);
  });

  it("createContact returns empty string when provider lacks createContact", async () => {
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: class {
        addToList = jest.fn();
        listSegments = jest.fn().mockResolvedValue([]);
      },
    }));

    process.env.EMAIL_PROVIDER = "sendgrid";
    const { createContact } = await import("../segments");
    await expect(createContact("user@example.com")).resolves.toBe("");
  });

  it("addToList resolves when provider only implements createContact", async () => {
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: class {
        createContact = jest.fn().mockResolvedValue("contact-1");
      },
    }));

    process.env.EMAIL_PROVIDER = "sendgrid";
    const { createContact, addToList } = await import("../segments");
    const id = await createContact("user@example.com");
    await expect(addToList(id, "l1")).resolves.toBeUndefined();
  });

  it("listSegments returns empty array when provider lacks listSegments", async () => {
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: class {
        createContact = jest.fn().mockResolvedValue("contact-1");
        addToList = jest.fn();
      },
    }));

    process.env.EMAIL_PROVIDER = "sendgrid";
    const { listSegments } = await import("../segments");
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

  it("createContact returns empty string when Sendgrid provider throws", async () => {
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: class {
        createContact = jest.fn(() => {
          throw new Error("sendgrid createContact");
        });
        addToList = jest.fn();
        listSegments = jest.fn();
      },
    }));

    process.env.EMAIL_PROVIDER = "sendgrid";
    const { createContact } = await import("../segments");
    await expect(createContact("user@example.com")).resolves.toBe("");
  });

  it("addToList resolves when Sendgrid provider throws", async () => {
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: class {
        createContact = jest.fn().mockResolvedValue("contact-1");
        addToList = jest.fn(() => {
          throw new Error("sendgrid addToList");
        });
        listSegments = jest.fn();
      },
    }));

    process.env.EMAIL_PROVIDER = "sendgrid";
    const { addToList } = await import("../segments");
    await expect(addToList("c1", "l1")).resolves.toBeUndefined();
  });

  it("listSegments returns empty array when Sendgrid provider throws", async () => {
    jest.doMock("../providers/sendgrid", () => ({
      SendgridProvider: class {
        createContact = jest.fn();
        addToList = jest.fn();
        listSegments = jest.fn(() => {
          throw new Error("sendgrid listSegments");
        });
      },
    }));

    process.env.EMAIL_PROVIDER = "sendgrid";
    const { listSegments } = await import("../segments");
    await expect(listSegments()).resolves.toEqual([]);
  });

  it("createContact returns empty string when Resend provider throws", async () => {
    jest.doMock("../providers/resend", () => ({
      ResendProvider: class {
        createContact = jest.fn(() => {
          throw new Error("resend createContact");
        });
        addToList = jest.fn();
        listSegments = jest.fn();
      },
    }));

    process.env.EMAIL_PROVIDER = "resend";
    const { createContact } = await import("../segments");
    await expect(createContact("user@example.com")).resolves.toBe("");
  });

  it("addToList resolves when Resend provider throws", async () => {
    jest.doMock("../providers/resend", () => ({
      ResendProvider: class {
        createContact = jest.fn().mockResolvedValue("contact-1");
        addToList = jest.fn(() => {
          throw new Error("resend addToList");
        });
        listSegments = jest.fn();
      },
    }));

    process.env.EMAIL_PROVIDER = "resend";
    const { addToList } = await import("../segments");
    await expect(addToList("c1", "l1")).resolves.toBeUndefined();
  });

  it("listSegments returns empty array when Resend provider throws", async () => {
    jest.doMock("../providers/resend", () => ({
      ResendProvider: class {
        createContact = jest.fn();
        addToList = jest.fn();
        listSegments = jest.fn(() => {
          throw new Error("resend listSegments");
        });
      },
    }));

    process.env.EMAIL_PROVIDER = "resend";
    const { listSegments } = await import("../segments");
    await expect(listSegments()).resolves.toEqual([]);
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

  it("returns events matching all filters", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify([
        {
          id: "vips",
          filters: [
            { field: "plan", value: "gold" },
            { field: "region", value: "us" },
          ],
        },
      ])
    );
    mockStat.mockResolvedValue({ mtimeMs: 1 });
    mockListEvents.mockResolvedValue([
      { email: "a@example.com", plan: "gold", region: "us" },
      { email: "b@example.com", plan: "gold", region: "eu" },
      { email: "c@example.com", plan: "silver", region: "us" },
    ]);

    const { resolveSegment } = await import("../segments");
    const result = await resolveSegment("shop1", "vips");
    expect(result).toEqual(["a@example.com"]);
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

  it("deduplicates emails from events", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify([
        { id: "vips", filters: [{ field: "plan", value: "gold" }] },
      ])
    );
    mockStat.mockResolvedValue({ mtimeMs: 1 });
    mockListEvents.mockResolvedValue([
      { email: "a@example.com", plan: "gold" },
      { email: "a@example.com", plan: "gold" },
      { email: "b@example.com", plan: "gold" },
    ]);

    const { resolveSegment } = await import("../segments");
    const result = await resolveSegment("shop1", "vips");
    expect(result.sort()).toEqual(["a@example.com", "b@example.com"].sort());
  });
});

describe("cacheTtl", () => {
  const originalTtl = process.env.SEGMENT_CACHE_TTL;

  afterEach(() => {
    if (originalTtl === undefined) delete process.env.SEGMENT_CACHE_TTL;
    else process.env.SEGMENT_CACHE_TTL = originalTtl;
    jest.resetModules();
  });

  it("returns default when ttl is negative", async () => {
    process.env.SEGMENT_CACHE_TTL = "-1";
    const { cacheTtl } = await import("../segments");
    expect(cacheTtl()).toBe(60_000);
  });

  it("returns default when ttl is zero", async () => {
    process.env.SEGMENT_CACHE_TTL = "0";
    const { cacheTtl } = await import("../segments");
    expect(cacheTtl()).toBe(60_000);
  });

  it("returns default when ttl is non-numeric", async () => {
    process.env.SEGMENT_CACHE_TTL = "abc";
    const { cacheTtl } = await import("../segments");
    expect(cacheTtl()).toBe(60_000);
  });
});

describe("resolveSegment caching", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
  afterEach(() => {
    delete process.env.SEGMENT_CACHE_TTL;
    jest.useRealTimers();
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
    jest.useFakeTimers();
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
    jest.advanceTimersByTime(500);
    const r2 = await resolveSegment("shop1", "vips");

    expect(r1).toEqual(["a@example.com"]);
    expect(r2).toEqual(["b@example.com"]);
    expect(mockListEvents).toHaveBeenCalledTimes(2);
  });

  it("uses cached data within ttl", async () => {
    jest.useFakeTimers();
    process.env.SEGMENT_CACHE_TTL = "1000";
    mockReadFile.mockResolvedValue(
      JSON.stringify([{ id: "vips", filters: [] }])
    );
    mockStat.mockResolvedValue({ mtimeMs: 1 });
    mockListEvents.mockResolvedValue([{ email: "a@example.com" }]);
    const { resolveSegment } = await import("../segments");

    const r1 = await resolveSegment("shop1", "vips");
    jest.advanceTimersByTime(500);
    mockListEvents.mockResolvedValue([{ email: "b@example.com" }]);
    const r2 = await resolveSegment("shop1", "vips");

    expect(r1).toEqual(["a@example.com"]);
    expect(r2).toEqual(["a@example.com"]);
    expect(mockListEvents).toHaveBeenCalledTimes(1);
  });

  it("refreshes cache after ttl expiry", async () => {
    jest.useFakeTimers();
    process.env.SEGMENT_CACHE_TTL = "1000";
    mockReadFile.mockResolvedValue(
      JSON.stringify([{ id: "vips", filters: [] }])
    );
    mockStat.mockResolvedValue({ mtimeMs: 1 });
    mockListEvents
      .mockResolvedValueOnce([{ email: "a@example.com" }])
      .mockResolvedValueOnce([{ email: "b@example.com" }]);
    const { resolveSegment } = await import("../segments");

    const r1 = await resolveSegment("shop1", "vips");
    jest.advanceTimersByTime(1001);
    const r2 = await resolveSegment("shop1", "vips");

    expect(r1).toEqual(["a@example.com"]);
    expect(r2).toEqual(["b@example.com"]);
    expect(mockListEvents).toHaveBeenCalledTimes(2);
  });

  it("honors custom ttl value", async () => {
    jest.useFakeTimers();
    process.env.SEGMENT_CACHE_TTL = "2000";
    mockReadFile.mockResolvedValue(
      JSON.stringify([{ id: "vips", filters: [] }])
    );
    mockStat.mockResolvedValue({ mtimeMs: 1 });
    mockListEvents
      .mockResolvedValueOnce([{ email: "a@example.com" }])
      .mockResolvedValueOnce([{ email: "b@example.com" }]);
    const { resolveSegment } = await import("../segments");

    const r1 = await resolveSegment("shop1", "vips");
    jest.advanceTimersByTime(1001);
    const r2 = await resolveSegment("shop1", "vips");
    jest.advanceTimersByTime(1000);
    const r3 = await resolveSegment("shop1", "vips");

    expect(r1).toEqual(["a@example.com"]);
    expect(r2).toEqual(["a@example.com"]);
    expect(r3).toEqual(["b@example.com"]);
    expect(mockListEvents).toHaveBeenCalledTimes(2);
  });
});

describe("resolveSegment events", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
  afterEach(() => {
    delete process.env.SEGMENT_CACHE_TTL;
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

