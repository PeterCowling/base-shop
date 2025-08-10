import { readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";

function loadFns() {
  const src = readFileSync(
    join(__dirname, "../../scripts/build-tokens.ts"),
    "utf8"
  );
  const cut = src.split("const outDir")[0];
  const transpiled = ts.transpileModule(cut, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandboxRequire = (mod: string) => {
    if (mod.includes("packages/themes/base/tokens.js")) {
      return { tokens: {} };
    }
    return require(mod);
  };
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    require: sandboxRequire,
  };
  runInNewContext(transpiled, sandbox);
  return {
    generateStaticCss: sandbox.generateStaticCss as (m: any) => string,
    generateDynamicCss: sandbox.generateDynamicCss as (m: any) => string,
    generateThemeCss: sandbox.generateThemeCss as (m: any) => string,
  };
}

describe("token css generators", () => {
  const tokens = {
    "--color-text": { light: "#000", dark: "#fff" },
    "--spacing-lg": { light: "1rem" },
  };
  const { generateStaticCss, generateDynamicCss, generateThemeCss } = loadFns();

  it("creates static css with dark mode", () => {
    const css = generateStaticCss(tokens as any);
    expect(css).toContain("--color-text: #000;");
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain("--color-text: #fff;");
    expect(css).toContain("--spacing-lg: 1rem;");
  });

  it("creates dynamic css using variables", () => {
    const css = generateDynamicCss(tokens as any);
    expect(css).toContain("--color-text: var(--token-color-text, #000);");
    expect(css).toContain("--color-text: var(--token-color-text-dark, #fff);");
  });

  it("creates theme css", () => {
    const css = generateThemeCss({ "--bg": "red" });
    expect(css).toContain(":root");
    expect(css).toContain("--bg: red;");
  });

  it("creates theme css with dark mode overrides", () => {
    const css = generateThemeCss({
      "--bg": "white",
      "--bg-dark": "black",
    });
    expect(css).toContain("--bg: white;");
    expect(css).toContain("--bg-dark: black;");
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain("html.theme-dark");
    expect(css).toContain("--bg: var(--bg-dark);");
  });
});
