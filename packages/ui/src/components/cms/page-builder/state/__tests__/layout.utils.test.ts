import type { PageComponent } from "@acme/types";
import { extractComponent, moveComponent } from "../layout/utils";

describe("layout utils", () => {
  const make = (
    id: string,
    children?: PageComponent[],
  ): PageComponent => ({ id, type: "Box", ...(children ? { children } : {}) } as PageComponent);

  describe("extractComponent", () => {
    it("removes root-level components by index", () => {
      const a = make("a");
      const b = make("b");
      const [item, rest] = extractComponent([a, b], undefined, 0);
      expect(item).toBe(a);
      expect(rest).toEqual([b]);
    });

    it("removes nested components from the specified parent", () => {
      const child1 = make("child1");
      const child2 = make("child2");
      const parent = make("parent", [child1, child2]);
      const [item, rest] = extractComponent([parent], "parent", 0);
      expect(item).toBe(child1);
      const updated = rest[0] as PageComponent & { children: PageComponent[] };
      expect(updated.children).toEqual([child2]);
    });
  });

  describe("moveComponent", () => {
    it("moves components between different parents", () => {
      const child = make("c");
      const source = make("source", [child]);
      const target = make("target", []);
      const result = moveComponent(
        [source, target],
        { parentId: "source", index: 0 },
        { parentId: "target", index: 0 },
      );
      const [src, tgt] = result as (PageComponent & { children?: PageComponent[] })[];
      expect(src.children).toEqual([]);
      expect(tgt.children).toEqual([child]);
    });

    it("moves components from parent to root", () => {
      const child = make("c");
      const parent = make("parent", [child]);
      const other = make("other");
      const result = moveComponent(
        [parent, other],
        { parentId: "parent", index: 0 },
        { index: 1 },
      );
      expect((result[0] as PageComponent & { children?: PageComponent[] }).children).toEqual([]);
      expect(result[1]).toBe(child);
      expect(result[2]).toBe(other);
    });

    it("moves root components into a parent", () => {
      const child = make("child");
      const parent = make("parent", []);
      const result = moveComponent(
        [child, parent],
        { index: 0 },
        { parentId: "parent", index: 0 },
      );
      expect(result).toHaveLength(1);
      const updated = result[0] as PageComponent & { children: PageComponent[] };
      expect(updated.id).toBe("parent");
      expect(updated.children).toEqual([child]);
    });
  });
});

