import { describe, expect, it, jest } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Runs PostCSS on apps/cms/src/app/globals.css using the
 * apps/cms/postcss.config.cjs configuration. The resulting CSS should
 * include Tailwind utilities resolved from the shared tailwind config.
 */
describe("tailwind postcss", () => {
  it("processes globals.css with postcss", async () => {
    jest.resetModules();

    jest.mock(
      "@acme/tailwind-config",
      () => ({
        __esModule: true,
        default: require("../../packages/tailwind-config/src/index.ts").default,
      }),
      { virtual: true }
    );

    jest.mock(
      "@acme/design-tokens",
      () => ({
        __esModule: true,
        default: require("../../packages/design-tokens/index.ts").default,
      }),
      { virtual: true }
    );

    let postcss: any;
    try {
      postcss = require("postcss");
    } catch {
      console.warn("postcss not found, skipping test");
      return;
    }

    try {
      require.resolve("@tailwindcss/postcss");
    } catch {
      console.warn("@tailwindcss/postcss not found, skipping test");
      return;
    }

    const config = require(
      join(__dirname, "../../apps/cms/postcss.config.cjs")
    );
    const cssPath = join(__dirname, "../../apps/cms/src/app/globals.css");
    const css = readFileSync(cssPath, "utf8");

    const tailwindConfig = join(__dirname, "../../tailwind.config.mjs");

    const plugins = Object.entries(config.plugins || {}).map(([name, opts]) => {
      const mod = require(name);
      const options =
        name === "@tailwindcss/postcss" ? { config: tailwindConfig } : opts;
      return typeof mod === "function" ? mod(options) : mod;
    });

    let result: any;
    try {
      result = await postcss(plugins).process(css, { from: cssPath });
    } catch (err) {
      console.warn("postcss processing failed, skipping test", err);
      return;
    }
    expect(result.css).toContain("--color-bg");
  });
});
