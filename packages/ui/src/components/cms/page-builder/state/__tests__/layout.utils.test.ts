import type { PageComponent } from "@acme/types";
import {
  addAt,
  addComponent,
  removeComponent,
  cloneWithNewIds,
  duplicateComponent,
  updateComponent,
  resizeComponent,
  extractComponent,
  moveComponent,
} from "../layout/utils";

describe("layout utils", () => {
  const make = (
    id: string,
    children?: PageComponent[],
  ): PageComponent => ({ id, type: "Box", ...(children ? { children } : {}) } as PageComponent);

  describe("addAt", () => {
    it("inserts at the provided index and preserves order", () => {
      const a = make("a");
      const c = make("c");
      const b = make("b");
      const result = addAt([a, c], 1, b);
      expect(result).toEqual([a, b, c]);
    });

    it("appends when index exceeds length", () => {
      const a = make("a");
      const b = make("b");
      expect(addAt([a], 5, b)).toEqual([a, b]);
    });
  });

  describe("addComponent", () => {
    it("adds a component into a nested parent", () => {
      const child1 = make("child1");
      const child2 = make("child2");
      const parent = make("parent", [child1, child2]);
      const newChild = make("new");
      const result = addComponent([parent], "parent", 1, newChild);
      const updated = result[0] as PageComponent & { children: PageComponent[] };
      expect(updated.children).toEqual([child1, newChild, child2]);
    });

    it("returns original list when parent id is missing", () => {
      const a = make("a");
      const list = [a];
      const result = addComponent(list, "missing", 0, make("b"));
      expect(result).toEqual(list);
      expect(result[0]).toBe(a);
    });
  });

  describe("removeComponent", () => {
    it("removes deeply nested components", () => {
      const leaf = make("leaf");
      const mid = make("mid", [leaf]);
      const root = make("root", [mid]);
      const result = removeComponent([root], "leaf");
      const updated = result[0] as PageComponent & { children: PageComponent[] };
      const midNode = updated.children[0] as PageComponent & { children?: PageComponent[] };
      expect(midNode.children).toEqual([]);
    });

    it("returns original list when id not found", () => {
      const a = make("a");
      const list = [a];
      const result = removeComponent(list, "missing");
      expect(result).toEqual(list);
      expect(result[0]).toBe(a);
    });
  });

  describe("cloneWithNewIds", () => {
    it("changes ids for all nested nodes", () => {
      const grand = make("grand");
      const child = make("child", [grand]);
      const parent = make("parent", [child]);
      const clone = cloneWithNewIds(parent);
      expect(clone.id).not.toBe(parent.id);
      const cloneChild = (clone.children ?? [])[0];
      const origChild = (parent.children ?? [])[0];
      expect(cloneChild.id).not.toBe(origChild.id);
      const cloneGrand = (cloneChild.children ?? [])[0];
      const origGrand = (origChild.children ?? [])[0];
      expect(cloneGrand.id).not.toBe(origGrand.id);
    });
  });

  describe("duplicateComponent", () => {
    it("returns the original list when target id is absent", () => {
      const a = make("a");
      const list = [a];
      const result = duplicateComponent(list, "missing");
      expect(result).toBe(list);
    });

    it("duplicates nested components next to the original", () => {
      const child1 = make("child1");
      const child2 = make("child2");
      const parent = make("parent", [child1, child2]);
      const result = duplicateComponent([parent], "child1");
      const updated = result[0] as PageComponent & { children: PageComponent[] };
      expect(updated.children).toHaveLength(3);
      expect(updated.children[0]).toBe(child1);
      expect(updated.children[1].id).not.toBe(child1.id);
      expect(updated.children[2]).toBe(child2);
    });
  });

  describe("updateComponent", () => {
    it("normalizes numeric fields from strings", () => {
      const a = make("a");
      const list = [a];
      const result = updateComponent(list, "a", {
        minItems: "5",
        maxItems: "bad",
      });
      const updated = result[0] as PageComponent & {
        minItems?: number;
        maxItems?: number;
      };
      expect(updated.minItems).toBe(5);
      expect(updated.maxItems).toBeUndefined();
    });

    it("keeps list unchanged when id is missing", () => {
      const a = make("a");
      const b = make("b");
      const list = [a, b];
      const result = updateComponent(list, "missing", { minItems: "1" });
      expect(result).toEqual(list);
      expect(result[0]).toBe(a);
      expect(result[1]).toBe(b);
    });
  });

  describe("resizeComponent", () => {
    it("applies patches to nested components", () => {
      const child = make("child");
      const parent = make("parent", [child]);
      const result = resizeComponent([parent], "child", { width: "20px" });
      const updated = result[0] as PageComponent & { children: PageComponent[] };
      expect(updated.children[0].width).toBe("20px");
    });

    it("returns original list when id not found", () => {
      const a = make("a");
      const list = [a];
      const result = resizeComponent(list, "missing", { width: "10px" });
      expect(result).toEqual(list);
      expect(result[0]).toBe(a);
    });
  });

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

    it("returns [null, list] when target is missing", () => {
      const a = make("a");
      const list = [a];
      const [item, rest] = extractComponent(list, "missing", 0);
      expect(item).toBeNull();
      expect(rest).toEqual(list);
      expect(rest[0]).toBe(a);
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

