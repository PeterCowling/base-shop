import { resolveSegment } from "../src/segments";

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

const { listEvents } = require("@platform-core/repositories/analytics.server") as {
  listEvents: jest.Mock;
};
const fs = require("fs").promises as {
  readFile: jest.Mock;
  stat: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  fs.stat.mockResolvedValue({ mtimeMs: 0 });
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
});

