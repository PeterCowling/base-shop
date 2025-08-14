import path from "node:path";
import { getComponentNameMap } from "../src/component-names";

describe("component name resolution", () => {
  it("maps file paths to exported component names", () => {
    const componentsDir = path.join(
      __dirname,
      "..",
      "..",
      "packages",
      "ui",
      "src",
      "components",
    );
    const map = getComponentNameMap(componentsDir);
    expect(map[path.join("molecules", "Breadcrumbs.tsx").replace(/\\/g, "/")]).toBe(
      "Breadcrumbs",
    );
    expect(map[path.join("molecules", "FormField.tsx").replace(/\\/g, "/")]).toBe(
      "FormField",
    );
    expect(map["ThemeToggle.tsx"]).toBe("ThemeToggle");
  });
});
