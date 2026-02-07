import type { PageComponent } from "@acme/types";

import { groupIntoContainer, ungroupContainer } from "../layout/utils";

describe("group/ungroup utilities", () => {
  const make = (id: string): PageComponent => ({ id, type: "Box" } as any);

  it("groups siblings into a Section at first index", () => {
    const list: PageComponent[] = [make("a"), make("b"), make("c")];
    const next = groupIntoContainer(list, ["a", "b"], "Section");
    expect(next).toHaveLength(2);
    expect(next[0]).toMatchObject({ type: "Section" });
    const container = next[0] as any;
    expect(Array.isArray(container.children)).toBe(true);
    expect(container.children.map((c: any) => c.id)).toEqual(["a", "b"]);
    // Remaining item preserved
    expect(next[1].id).toBe("c");
  });

  it("groups siblings into a MultiColumn and sets columns", () => {
    const list: PageComponent[] = [make("a"), make("b"), make("c")];
    const next = groupIntoContainer(list, ["b", "c"], "MultiColumn");
    expect(next).toHaveLength(2);
    const container = next[1] as any; // inserted at index of "b"
    expect(container.type).toBe("MultiColumn");
    expect(container.columns).toBe(2);
    expect(container.children.map((c: any) => c.id)).toEqual(["b", "c"]);
  });

  it("ungroups a container back into its parent's list", () => {
    const section: any = { id: "group1", type: "Section", children: [make("x"), make("y")] };
    const list: PageComponent[] = [make("a"), section as PageComponent, make("b")];
    const next = ungroupContainer(list, "group1");
    expect(next.map((c) => c.id)).toEqual(["a", "x", "y", "b"]);
  });
});

