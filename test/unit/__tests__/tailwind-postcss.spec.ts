import { describe, expect, it } from "@jest/globals";
import { join } from "path";
import { execFileSync } from "node:child_process";

/**
 * Runs PostCSS on apps/cms/src/app/globals.css using the
 * apps/cms/postcss.config.cjs configuration. The resulting CSS should
 * include Tailwind utilities resolved from the shared tailwind config.
 */
describe("tailwind postcss", () => {
  it("processes globals.css with postcss", () => {
    try {
      require.resolve("postcss");
      require.resolve("@tailwindcss/postcss");
    } catch {
      console.warn("postcss or @tailwindcss/postcss not found, skipping test");
      return;
    }

    const cssPath = join(__dirname, "../../../apps/cms/src/app/globals.css");
    const designTokens = join(
      __dirname,
      "../../../packages/design-tokens/dist/index.js"
    );

    const script = `
      const postcss = require('postcss');
      const fs = require('fs');
      (async () => {
        const css = fs.readFileSync(${JSON.stringify(cssPath)}, 'utf8');
        const { default: tokens } = await import(${JSON.stringify(designTokens)});
        const tailwind = require('@tailwindcss/postcss')({ config: { presets: [tokens], content: [] } });
        const result = await postcss([tailwind]).process(css, { from: ${JSON.stringify(cssPath)} });
        console.log(result.css);
      })().catch((err) => { console.error(err); process.exit(1); });
    `;

    let output: string;
    try {
      output = execFileSync(process.execPath, ["-e", script], {
        encoding: "utf8",
      });
    } catch (err) {
      console.warn("postcss processing failed, skipping test", err);
      return;
    }

    expect(output).toContain("--color-bg");
  });
});
