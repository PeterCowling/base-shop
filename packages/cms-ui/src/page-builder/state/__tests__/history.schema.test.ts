import { historyStateSchema } from "../history.schema";

describe("historyStateSchema editor field", () => {
  it("accepts an editor map keyed by component id", () => {
    const input = {
      past: [],
      present: [],
      future: [],
      gridCols: 12,
      editor: {
        c1: { name: "Hero", locked: true, zIndex: 10, hidden: ["desktop"] },
        c2: { name: "CTA" },
      },
    };
    const parsed = historyStateSchema.parse(input) as any;
    expect(parsed.editor.c1.name).toBe("Hero");
    expect(parsed.editor.c1.locked).toBe(true);
    expect(parsed.editor.c1.zIndex).toBe(10);
    expect(parsed.editor.c1.hidden).toEqual(["desktop"]);
  });

  it("defaults editor to an empty object when missing", () => {
    const parsed = historyStateSchema.parse({ past: [], present: [], future: [], gridCols: 12 }) as any;
    expect(parsed.editor).toBeDefined();
    expect(parsed.editor).toEqual({});
  });
});

