// apps/cms/__tests__/listUtils.test.ts
/* eslint-env jest */

import { toggleItem } from "@ui/utils/toggleItem";

describe("toggleItem", () => {
  it("toggles values within an array", () => {
    let items: string[] = [];
    items = toggleItem(items, "a");
    expect(items).toEqual(["a"]);
    items = toggleItem(items, "a");
    expect(items).toEqual([]);
    items = toggleItem(items, "b");
    expect(items).toEqual(["b"]);
  });
});
