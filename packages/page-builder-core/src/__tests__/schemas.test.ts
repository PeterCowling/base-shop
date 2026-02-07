import {
  type HistoryState,
  historyStateSchema,
  pageComponentSchema,
  pageSchema,
} from "..";

describe("Page and History schemas", () => {
  const basePage = {
    id: "p1",
    slug: "home",
    status: "draft",
    seo: { title: { en: "Home" } },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "tester",
  } as const;

  it("parses a valid Page and applies history defaults", () => {
    const page = pageSchema.parse({
      ...basePage,
      history: {
        editor: {
          a: { hidden: ["desktop"] },
        },
      },
    });

    expect(page.components).toEqual([]);
    expect(page.history).toBeDefined();
    expect(page.history?.gridCols).toBe(12);
    expect(page.history?.past).toEqual([]);
    expect(page.history?.future).toEqual([]);
    expect(page.history?.editor?.a?.hidden).toEqual(["desktop"]);
  });

  it("rejects Page with invalid history state", () => {
    const invalid = {
      ...basePage,
      history: {
        gridCols: 0,
      },
    };

    const result = pageSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("historyStateSchema enforces gridCols bounds and stack defaults", () => {
    const parsed = historyStateSchema.parse({});

    expect(parsed.gridCols).toBe(12);
    expect(parsed.past).toEqual([]);
    expect(parsed.present).toEqual([]);
    expect(parsed.future).toEqual([]);

    expect(() =>
      historyStateSchema.parse({ gridCols: 0 } as Partial<HistoryState>),
    ).toThrow();
  });
});

describe("pageComponentSchema", () => {
  it("accepts a known component type", () => {
    const component = {
      id: "c1",
      type: "Text",
      text: "Hello",
    };
    expect(pageComponentSchema.safeParse(component).success).toBe(true);
  });

  it("rejects an unknown component type", () => {
    const invalid = {
      id: "c1",
      type: "Unknown",
    };
    expect(pageComponentSchema.safeParse(invalid).success).toBe(false);
  });
});

