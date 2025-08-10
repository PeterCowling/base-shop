// packages/platform-core/__tests__/defaultFilterMappings.test.ts

import { defaultFilterMappings } from "../defaultFilterMappings";

describe("defaultFilterMappings", () => {
  it("contains required keys and values", () => {
    expect(defaultFilterMappings).toHaveProperty("brand", "brand");
    expect(defaultFilterMappings).toHaveProperty("size", "size");
    expect(defaultFilterMappings).toHaveProperty("color", "color");
  });

  it("is immutable when frozen", () => {
    Object.freeze(defaultFilterMappings);
    expect(Object.isFrozen(defaultFilterMappings)).toBe(true);
    expect(() => {
      (defaultFilterMappings as any).brand = "foo";
    }).toThrow(TypeError);
    expect(defaultFilterMappings.brand).toBe("brand");
  });
});

