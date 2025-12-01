import type { Page } from "@acme/types";
import { diffPage, mergeDefined, parsePageDiffHistory } from "../pageHistory";

describe("diffPage", () => {
  const basePage: Page = {
    id: "p1",
    slug: "home",
    status: "draft",
    components: [],
    seo: { title: { en: "Home" } },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "tester",
  };

  it("returns full next page when previous is undefined", () => {
    const patch = diffPage(undefined, basePage);
    expect(patch).toEqual(basePage);
  });

  it("returns only changed fields when previous provided", () => {
    const previous: Page = {
      ...basePage,
      slug: "old-home",
      visibility: "public",
    };
    const next: Page = {
      ...basePage,
      slug: "new-home",
      visibility: "hidden",
    };

    const patch = diffPage(previous, next);

    expect(patch.slug).toBe("new-home");
    expect(patch.visibility).toBe("hidden");
    expect("status" in patch).toBe(false);
  });
});

describe("mergeDefined", () => {
  it("merges defined fields and preserves existing values when patch is undefined or missing", () => {
    const base = {
      slug: "home",
      visibility: "public" as const,
    };
    const patch = {
      slug: "updated-home",
      visibility: undefined,
    };

    const merged = mergeDefined(base, patch);

    expect(merged.slug).toBe("updated-home");
    expect(merged.visibility).toBe("public");
  });
});

describe("parsePageDiffHistory", () => {
  it("parses valid entries and skips malformed lines", () => {
    const input = [
      JSON.stringify({
        timestamp: "2024-01-01T00:00:00.000Z",
        diff: { slug: "home" },
      }),
      "not-json",
      JSON.stringify({
        timestamp: "not-a-date",
        diff: { slug: "invalid" },
      }),
      JSON.stringify({
        timestamp: "2024-01-02T00:00:00.000Z",
        diff: { visibility: "hidden" },
      }),
    ].join("\n");

    const entries = parsePageDiffHistory(input);

    expect(entries).toHaveLength(2);
    expect(entries[0].timestamp).toBe("2024-01-01T00:00:00.000Z");
    expect(entries[0].diff.slug).toBe("home");
    expect(entries[1].timestamp).toBe("2024-01-02T00:00:00.000Z");
    expect(entries[1].diff.visibility).toBe("hidden");
  });

  it("returns empty array for blank input", () => {
    expect(parsePageDiffHistory("")).toEqual([]);
    expect(parsePageDiffHistory("   \n ")).toEqual([]);
  });
});

