// scripts/__tests__/upgrade-shop.test.ts
import path from "node:path";
import { buildComponentExportMap, resolveComponentName } from "../src/upgrade-utils";

const currentDir = __dirname;

describe("resolveComponentName", () => {
  const componentsDir = path.join(
    currentDir,
    "..",
    "..",
    "packages",
    "ui",
    "src",
    "components",
  );
  const map = buildComponentExportMap(componentsDir);

  test("maps known component", () => {
    const file = path.join(componentsDir, "DynamicRenderer.tsx");
    expect(resolveComponentName(file, map)).toBe("DynamicRenderer");
  });

  test("returns undefined for unknown file", () => {
    const file = path.join(componentsDir, "DoesNotExist.tsx");
    expect(resolveComponentName(file, map)).toBeUndefined();
  });
});

