import { type Filter,matches } from "../segments/filters";

describe("matches", () => {
  it("compares numeric values", () => {
    const f: Filter = { field: "count", op: "gt", value: "5" };
    expect(matches(f, { count: 10 } as any)).toBe(true);
    expect(matches({ field: "count", op: "lt", value: "5" }, { count: 10 } as any)).toBe(false);
  });

  it("compares date values", () => {
    const event = { when: "2024-01-02T00:00:00Z" };
    expect(
      matches(
        { field: "when", op: "gt", value: "2024-01-01T00:00:00Z" },
        event as any
      )
    ).toBe(true);
    expect(
      matches(
        { field: "when", op: "lt", value: "2024-01-03T00:00:00Z" },
        event as any
      )
    ).toBe(true);
  });

  it("compares string values", () => {
    expect(matches({ field: "name", value: "Alice" }, { name: "Alice" } as any)).toBe(
      true
    );
    expect(matches({ field: "name", value: "Bob" }, { name: "Alice" } as any)).toBe(
      false
    );
  });
});
