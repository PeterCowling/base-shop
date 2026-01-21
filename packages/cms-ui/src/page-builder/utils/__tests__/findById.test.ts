// packages/ui/src/components/cms/page-builder/utils/__tests__/findById.test.ts
import { findById } from "../findById";

describe("findById", () => {
  const tree = [
    { id: "a", type: "x", children: [{ id: "a1", type: "y" }] },
    { id: "b", type: "x", children: [{ id: "b1", type: "y" }, { id: "b2", type: "y" }] },
  ] as any[];

  test("returns node by id at root or nested", () => {
    expect(findById(tree as any, "a")?.id).toBe("a");
    expect(findById(tree as any, "b2")?.id).toBe("b2");
    expect(findById(tree as any, "missing")).toBeNull();
  });
});

