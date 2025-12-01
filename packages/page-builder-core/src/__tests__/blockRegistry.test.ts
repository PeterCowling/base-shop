import type { BlockRegistry } from "../blocks/registry";
import { buildBlockRegistry, type BlockTypeId } from "../blocks/registry";
import { coreBlockDescriptors } from "../blocks/core-blocks";

describe("block registry contracts", () => {
  it("buildBlockRegistry produces descriptor and registry maps keyed by BlockTypeId", () => {
    const entryComponent = { name: "Comp" } as const;

    const { descriptors, registry } = buildBlockRegistry(
      coreBlockDescriptors,
      [
        {
          type: "HeroBanner",
          entry: entryComponent,
        },
        {
          type: "ProductGrid",
          entry: entryComponent,
        },
      ],
    );

    const keys = Object.keys(descriptors) as BlockTypeId[];
    expect(keys).toEqual(
      expect.arrayContaining(["HeroBanner", "ProductGrid"] as BlockTypeId[]),
    );

    const regKeys = Object.keys(registry as BlockRegistry<unknown>);
    expect(regKeys).toEqual(
      expect.arrayContaining(["HeroBanner", "ProductGrid"]),
    );
  });

  it("coreBlockDescriptors does not contain duplicate type ids", () => {
    const seen = new Set<string>();
    for (const d of coreBlockDescriptors) {
      expect(seen.has(d.type)).toBe(false);
      seen.add(d.type);
    }
  });
});
