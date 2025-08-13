import { resolveSegment } from "../segments";

const listEventsMock = jest.fn();

jest.mock("@platform-core/repositories/analytics.server", () => ({
  listEvents: (...args: unknown[]) => listEventsMock(...args),
}));

describe("resolveSegment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ignores malformed events", async () => {
    listEventsMock.mockResolvedValueOnce([
      { type: "segment:vips" },
      { email: "no-type@example.com" },
      { type: "segment", segment: "other", email: "other@example.com" },
      { type: "segment:vips", email: "valid@example.com" },
      { type: "segment", segment: "vips", email: 123 },
    ]);

    const emails = await resolveSegment("shop1", "vips");
    expect(emails).toEqual(["valid@example.com"]);
  });

  it("deduplicates emails", async () => {
    listEventsMock.mockResolvedValueOnce([
      { type: "segment:vips", email: "dup@example.com" },
      { type: "segment", segment: "vips", email: "dup@example.com" },
      { type: "segment:vips", email: "dup@example.com" },
    ]);

    const emails = await resolveSegment("shop1", "vips");
    expect(emails).toEqual(["dup@example.com"]);
  });

  it("handles mixed segment representations", async () => {
    listEventsMock.mockResolvedValueOnce([
      { type: "segment:vips", email: "a@example.com" },
      { type: "segment", segment: "vips", email: "b@example.com" },
      { type: "segment", segment: "other", email: "c@example.com" },
      { type: "segment:other", email: "d@example.com" },
    ]);

    const emails = await resolveSegment("shop1", "vips");
    expect(emails.sort()).toEqual(["a@example.com", "b@example.com"].sort());
  });
});
