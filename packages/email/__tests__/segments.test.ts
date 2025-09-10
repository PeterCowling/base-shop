
const sendgrid = {
  createContact: jest.fn().mockResolvedValue("sg"),
  addToList: jest.fn(),
  listSegments: jest.fn().mockResolvedValue([{ id: "sg" }]),
};

const resend = {
  createContact: jest.fn().mockResolvedValue("rs"),
  addToList: jest.fn(),
  listSegments: jest.fn().mockResolvedValue([{ id: "rs" }]),
};

jest.mock("../src/providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => sendgrid),
}));

jest.mock("../src/providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => resend),
}));

jest.mock("@platform-core/repositories/analytics.server", () => ({
  listEvents: jest.fn(),
}));

jest.mock("@platform-core/dataRoot", () => ({
  DATA_ROOT: "/data",
  resolveDataRoot: () => "/data",
}));

jest.mock("@acme/lib", () => ({
  validateShopName: (s: string) => s,
}));

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    stat: jest.fn(),
  },
}));

const {
  resolveSegment,
  readSegments,
  analyticsMTime,
  createContact,
  addToList,
  listSegments,
  cacheTtl,
} = require("../src/segments");

const { listEvents } = require("@platform-core/repositories/analytics.server") as {
  listEvents: jest.Mock;
};
const fs = require("fs").promises as {
  readFile: jest.Mock;
  stat: jest.Mock;
};

const ORIG_PROVIDER = process.env.EMAIL_PROVIDER;
const ORIG_TTL = process.env.SEGMENT_CACHE_TTL;

beforeEach(() => {
  jest.clearAllMocks();
  fs.stat.mockResolvedValue({ mtimeMs: 0 });
});

afterEach(() => {
  process.env.EMAIL_PROVIDER = ORIG_PROVIDER;
  process.env.SEGMENT_CACHE_TTL = ORIG_TTL;
  jest.useRealTimers();
});

describe("readSegments", () => {
  it("returns empty array when file is missing", async () => {
    fs.readFile.mockRejectedValueOnce(new Error("nope"));
    await expect(readSegments("shop")).resolves.toEqual([]);
  });

  it("parses valid JSON arrays", async () => {
    fs.readFile.mockResolvedValueOnce(
      JSON.stringify([{ id: "s1", filters: [] }])
    );
    await expect(readSegments("shop")).resolves.toEqual([
      { id: "s1", filters: [] },
    ]);
  });

  it("ignores non-array JSON", async () => {
    fs.readFile.mockResolvedValueOnce(JSON.stringify({ foo: 1 }));
    await expect(readSegments("shop")).resolves.toEqual([]);
  });
});

describe("analyticsMTime", () => {
  it("returns file modification time", async () => {
    fs.stat.mockResolvedValueOnce({ mtimeMs: 123 });
    await expect(analyticsMTime("shop")).resolves.toBe(123);
  });

  it("falls back to 0 when file missing", async () => {
    fs.stat.mockRejectedValueOnce(new Error("missing"));
    await expect(analyticsMTime("shop")).resolves.toBe(0);
  });
});

describe("cacheTtl", () => {
  it("returns default when SEGMENT_CACHE_TTL is non-numeric", () => {
    process.env.SEGMENT_CACHE_TTL = "abc";
    expect(cacheTtl()).toBe(60000);
  });

  it("returns default when SEGMENT_CACHE_TTL is negative", () => {
    process.env.SEGMENT_CACHE_TTL = "-1";
    expect(cacheTtl()).toBe(60000);
  });
});

describe("segment cache", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(0);
    fs.readFile.mockResolvedValue(
      JSON.stringify([{ id: "seg", filters: [] }])
    );
  });

  it("expires cached results after SEGMENT_CACHE_TTL", async () => {
    process.env.SEGMENT_CACHE_TTL = "1000";
    fs.stat.mockResolvedValue({ mtimeMs: 1 });
    listEvents.mockResolvedValueOnce([{ email: "a@example.com" }]);

    expect(await resolveSegment("shop", "seg")).toEqual(["a@example.com"]);

    listEvents.mockClear();
    listEvents.mockResolvedValueOnce([{ email: "b@example.com" }]);
    expect(await resolveSegment("shop", "seg")).toEqual(["a@example.com"]);
    expect(listEvents).not.toHaveBeenCalled();

    jest.setSystemTime(1001);
    expect(await resolveSegment("shop", "seg")).toEqual(["b@example.com"]);
    expect(listEvents).toHaveBeenCalledTimes(1);
  });

  it("invalidates cache when analytics mtime changes", async () => {
    process.env.SEGMENT_CACHE_TTL = "10000";
    fs.stat
      .mockResolvedValueOnce({ mtimeMs: 1 })
      .mockResolvedValueOnce({ mtimeMs: 2 });
    listEvents.mockResolvedValueOnce([{ email: "a@example.com" }]);
    expect(await resolveSegment("shop2", "seg")).toEqual(["a@example.com"]);

    listEvents.mockClear();
    listEvents.mockResolvedValueOnce([{ email: "b@example.com" }]);
    expect(await resolveSegment("shop2", "seg")).toEqual(["b@example.com"]);
    expect(listEvents).toHaveBeenCalledTimes(1);
  });
});

describe("resolveSegment", () => {
  it("returns emails matching segment filters", async () => {
    fs.readFile.mockResolvedValueOnce(
      JSON.stringify([{ id: "seg1", filters: [{ field: "plan", value: "pro" }] }])
    );

    listEvents.mockResolvedValue([
      { email: "match@example.com", plan: "pro" },
      { email: "other@example.com", plan: "basic" },
    ]);

    const emails = await resolveSegment("shop", "seg1");

    expect(emails).toEqual(["match@example.com"]);
  });

  it("requires all filters to match", async () => {
    fs.readFile.mockResolvedValueOnce(
      JSON.stringify([
        {
          id: "seg2",
          filters: [
            { field: "plan", value: "pro" },
            { field: "active", value: "true" },
          ],
        },
      ])
    );

    listEvents.mockResolvedValue([
      { email: "both@example.com", plan: "pro", active: "true" },
      { email: "plan-only@example.com", plan: "pro", active: "false" },
      { email: "active-only@example.com", plan: "basic", active: "true" },
    ]);

    const emails = await resolveSegment("shop", "seg2");

    expect(emails).toEqual(["both@example.com"]);
  });

  it("falls back to segment events when no definition is found", async () => {
    fs.readFile.mockResolvedValueOnce(JSON.stringify([]));

    listEvents.mockResolvedValue([
      { email: "a@example.com", type: "segment:seg3" },
      { email: "b@example.com", type: "segment", segment: "seg3" },
      { email: "c@example.com", type: "segment:other" },
    ]);

    const emails = await resolveSegment("shop", "seg3");

    expect(emails.sort()).toEqual(["a@example.com", "b@example.com"]);
  });

  it("ignores events without email addresses", async () => {
    fs.readFile.mockResolvedValueOnce(
      JSON.stringify([{ id: "seg4", filters: [] }])
    );

    listEvents.mockResolvedValue([
      { email: "valid@example.com" },
      { plan: "pro" },
      { email: undefined },
    ]);

    const emails = await resolveSegment("shop", "seg4");

    expect(emails).toEqual(["valid@example.com"]);
  });
});

describe("provider-dependent operations", () => {
  it("forwards calls to the configured provider", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    await createContact("a@example.com");
    await addToList("cid", "lid");
    await listSegments();
    expect(sendgrid.createContact).toHaveBeenCalledWith("a@example.com");
    expect(sendgrid.addToList).toHaveBeenCalledWith("cid", "lid");
    expect(sendgrid.listSegments).toHaveBeenCalled();

    process.env.EMAIL_PROVIDER = "resend";
    await createContact("b@example.com");
    await addToList("cid2", "lid2");
    await listSegments();
    expect(resend.createContact).toHaveBeenCalledWith("b@example.com");
    expect(resend.addToList).toHaveBeenCalledWith("cid2", "lid2");
    expect(resend.listSegments).toHaveBeenCalled();
  });

  it("handles provider errors gracefully", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    sendgrid.createContact.mockImplementationOnce(async () => {
      throw new Error("boom");
    });
    sendgrid.addToList.mockImplementationOnce(async () => {
      throw new Error("boom");
    });
    sendgrid.listSegments.mockImplementationOnce(async () => {
      throw new Error("boom");
    });

    const id = await createContact("err@example.com");
    await expect(addToList("c", "l")).resolves.toBeUndefined();
    const segs = await listSegments();

    expect(id).toBe("");
    expect(segs).toEqual([]);
    expect(sendgrid.createContact).toHaveBeenCalledWith("err@example.com");
    expect(sendgrid.addToList).toHaveBeenCalledWith("c", "l");
    expect(sendgrid.listSegments).toHaveBeenCalled();
  });

  it("no-ops when no provider configured", async () => {
    process.env.EMAIL_PROVIDER = "";
    const id = await createContact("none@example.com");
    await addToList("c", "l");
    const segs = await listSegments();
    expect(id).toBe("");
    expect(sendgrid.createContact).not.toHaveBeenCalled();
    expect(sendgrid.addToList).not.toHaveBeenCalled();
    expect(segs).toEqual([]);
  });
});

