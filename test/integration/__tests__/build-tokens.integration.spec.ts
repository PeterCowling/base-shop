import { execFileSync } from "child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { pathToFileURL } from "url";
import ts from "typescript";

describe("build-tokens script", () => {
  it("generates expected css files", () => {
    const tmp = mkdtempSync(join(tmpdir(), "tokens-"));
    try {
      // create directory structure
      const scriptsDir = join(tmp, "scripts");
      const themeDir = join(tmp, "packages", "themes", "base");
      mkdirSync(scriptsDir, { recursive: true });
      mkdirSync(themeDir, { recursive: true });

      // copy tokens
      copyFileSync(
        join(__dirname, "../../../packages/themes/base/tokens.js"),
        join(themeDir, "tokens.js")
      );

      // transpile the repository script to ESM and execute with node
      const source = readFileSync(
        join(__dirname, "../../../scripts/build-tokens.ts"),
        "utf8"
      );
      const js = ts
        .transpileModule(source, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2019,
          },
        })
        .outputText.replace(
          'from "typescript"',
          `from "${pathToFileURL(require.resolve("typescript")).href}"`
        );
      writeFileSync(join(scriptsDir, "build-tokens.mjs"), js);

      execFileSync(process.execPath, [join(scriptsDir, "build-tokens.mjs")], {
        cwd: join(__dirname, "../../.."),
        env: {
          ...process.env,
          NODE_PATH: join(__dirname, "../../../node_modules"),
        },
      });

      const staticCss = readFileSync(
        join(themeDir, "tokens.static.css"),
        "utf8"
      );
      const dynamicCss = readFileSync(
        join(themeDir, "tokens.dynamic.css"),
        "utf8"
      );

      const expectedStatic = readFileSync(
        join(__dirname, "../../../packages/themes/base/tokens.static.css"),
        "utf8"
      );
      const expectedDynamic = readFileSync(
        join(__dirname, "../../../packages/themes/base/tokens.dynamic.css"),
        "utf8"
      );

      const clean = (s: string) =>
        s
          .replace(/\s+/g, " ")
          .replace(/\(\s+/g, "(")
          .replace(/\s+\)/g, ")")
          .trim();

      expect(clean(staticCss)).toBe(clean(expectedStatic));
      expect(clean(dynamicCss)).toBe(clean(expectedDynamic));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
