import { catalog } from "../worker-catalog.generated";

describe("worker catalog wireup", () => {
  test("generated catalog has 12 variants", () => {
    expect(Array.isArray(catalog)).toBe(true);
    expect(catalog).toHaveLength(12);
  });
});
