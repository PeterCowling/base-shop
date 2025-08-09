// apps/cms/__tests__/listUtils.test.ts
/* eslint-env jest */

import { toggle } from "../src/app/cms/wizard/listUtils";

describe("listUtils", () => {
  it("toggles values within an array", () => {
    let items: string[] = [];
    items = toggle(items, "a");
    expect(items).toEqual(["a"]);
    items = toggle(items, "a");
    expect(items).toEqual([]);
    items = toggle(items, "b");
    expect(items).toEqual(["b"]);
  });
});
