import {
  buildIdeasSearchParams,
  parseIdeasQueryState,
} from "./query-params";

describe("ideas query params", () => {
  it("TC-06: URL params round-trip filter and section pagination state", () => {
    const state = parseIdeasQueryState({
      business: "BRIK",
      status: "raw",
      location: "worked",
      tag: "ops",
      q: "email campaign",
      primaryPage: "3",
      primaryPageSize: "25",
      secondaryPage: "2",
      secondaryPageSize: "100",
    });

    const encoded = buildIdeasSearchParams(state);
    const decoded = parseIdeasQueryState(encoded);

    expect(decoded).toEqual(state);
  });

  it("falls back to safe defaults for invalid values", () => {
    const parsed = parseIdeasQueryState({
      status: "invalid",
      location: "unknown",
      primaryPage: "-1",
      primaryPageSize: "999",
      secondaryPage: "nan",
      secondaryPageSize: "0",
    });

    expect(parsed.status).toBe("all");
    expect(parsed.location).toBe("all");
    expect(parsed.primaryPage).toBe(1);
    expect(parsed.primaryPageSize).toBe(50);
    expect(parsed.secondaryPage).toBe(1);
    expect(parsed.secondaryPageSize).toBe(50);
  });

  it("supports legacy shared page params as fallback for both sections", () => {
    const parsed = parseIdeasQueryState({
      page: "4",
      pageSize: "25",
    });

    expect(parsed.primaryPage).toBe(4);
    expect(parsed.secondaryPage).toBe(4);
    expect(parsed.primaryPageSize).toBe(25);
    expect(parsed.secondaryPageSize).toBe(25);
  });
});
