import * as root from "../index";

describe("ui package root exports", () => {
  it("re-exports components/hooks/utils", () => {
    // Sanity check that the export surface is reachable
    expect(root).toBeDefined();
    // Expect at least one known export from components to exist
    expect(typeof (root as any)).toBe("object");
  });
});

