import path from "node:path";
import fs from "node:fs";
import os from "node:os";
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

  it("infers names for default exports without alias", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "components-"));
    fs.writeFileSync(path.join(tmp, "index.ts"), 'export { default } from "./Foo";');
    fs.writeFileSync(path.join(tmp, "Foo.tsx"), "export default function Foo() { return null; }");
    const map = getComponentNameMap(tmp);
    expect(map["Foo.tsx"]).toBe("Foo");
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
