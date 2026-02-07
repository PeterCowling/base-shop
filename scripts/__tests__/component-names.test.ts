import fs from "node:fs";
import os from "node:os";
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
    // Test components that are exported with explicit default aliases
    expect(map[path.join("molecules", "Accordion.tsx").replace(/\\/g, "/")]).toBe(
      "AccordionMolecule",
    );
    expect(map["ThemeToggle.tsx"]).toBe("ThemeToggle");
    expect(map["ComponentPreview.tsx"]).toBe("ComponentPreview");
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
