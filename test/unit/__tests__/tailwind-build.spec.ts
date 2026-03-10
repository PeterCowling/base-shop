import { readFileSync } from "node:fs";
import path from "node:path";
import { deserialize, serialize } from "node:v8";

import { describe, expect, it } from "@jest/globals";
import postcss from "postcss";

const tailwindPostcssPlugin = require("@tailwindcss/postcss");

if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = <T>(value: T): T => deserialize(serialize(value));
}

describe("tailwind build", () => {
  const buildCss = async (inputPath: string): Promise<string> => {
    const absoluteInputPath = path.resolve(inputPath);
    const source = readFileSync(absoluteInputPath, "utf8");
    const result = await postcss([tailwindPostcssPlugin()]).process(source, {
      from: absoluteInputPath,
    });
    return result.css;
  };

  it("builds cms globals.css with tailwind", async () => {
    const css = await buildCss("apps/cms/src/app/globals.css");
    expect(css).toContain("--color-bg");
  });

  it("builds reception globals.css with tailwind", async () => {
    const css = await buildCss("apps/reception/src/app/globals.css");
    expect(css).toContain("--reception-dark-bg");
    expect(css).toContain("--reception-dark-surface");
    expect(css).toContain(".dark\\:bg-surface-dark");
    expect(css).toContain(".dark\\:text-accent-hospitality");
    expect(css).toContain(".bg-primary");
    expect(css).toContain(".bg-primary-main");
    expect(css).toContain(".bg-input");
    expect(css).toContain(".text-primary-foreground");
    expect(css).toContain(".text-primary-fg");
    expect(css).not.toMatch(/--color-primary:\s*var\(--color-primary\)/);
    expect(css).not.toMatch(/--color-primary-fg:\s*var\(--color-primary-fg\)/);
    expect(css).not.toMatch(/--color-border-strong:\s*var\(--color-border-strong\)/);
  });
});
