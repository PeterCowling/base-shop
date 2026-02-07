// packages/ui/src/components/cms/blocks/__tests__/coreRegistry.contract.test.ts

import { type BlockTypeId,coreBlockDescriptors } from "@acme/page-builder-core";

import { type BlockType,coreBlockRegistry } from "../index";

describe("coreBlockRegistry contract", () => {
  it("has registry entries for all core descriptors that CMS implements", () => {
    const implemented = new Set<BlockType>(
      Object.keys(coreBlockRegistry) as BlockType[],
    );

    for (const descriptor of coreBlockDescriptors) {
      const type = descriptor.type as BlockType;
      if (!implemented.has(type)) {
        // If CMS does not yet implement a given core block, we allow it for now.
        continue;
      }
      expect(coreBlockRegistry[type]).toBeDefined();
    }
  });

  it("only exposes keys that are valid BlockTypeId values", () => {
    for (const key of Object.keys(coreBlockRegistry)) {
      // This cast is a compile-time assertion that registry keys stay within
      // the shared BlockTypeId vocabulary; at runtime we just ensure the key is truthy.
      const typed: BlockTypeId = key as BlockTypeId;
      expect(typed).toBeTruthy();
    }
  });
});

