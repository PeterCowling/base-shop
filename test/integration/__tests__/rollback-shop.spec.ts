import { execFileSync } from "child_process";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import ts from "typescript";

describe("rollback-shop script", () => {
  it("restores previous component versions and updates metadata", () => {
    const tmp = mkdtempSync(join(tmpdir(), "rollback-"));
    try {
      const scriptsDir = join(tmp, "scripts");
      mkdirSync(scriptsDir, { recursive: true });
      const source = readFileSync(
        join(__dirname, "../../../scripts/src/rollback-shop.ts"),
        "utf8"
      );
      const js = ts
        .transpileModule(source, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2019,
          },
        })
        .outputText;
      const scriptPath = join(scriptsDir, "rollback-shop.js");
      writeFileSync(scriptPath, js);

      const binDir = join(tmp, "bin");
      mkdirSync(binDir);
      const logPath = join(tmp, "pnpm.log");
      writeFileSync(
        join(binDir, "pnpm"),
        `#!/usr/bin/env node\nconst fs=require('fs');fs.appendFileSync(process.env.LOG_PATH, process.argv.slice(2).join(" ")+"\\n");`
      );
      chmodSync(join(binDir, "pnpm"), 0o755);

      const appDir = join(tmp, "apps", "shop-test");
      mkdirSync(appDir, { recursive: true });
      writeFileSync(
        join(appDir, "package.json"),
        JSON.stringify({ dependencies: { pkg: "2.0.0" } }, null, 2)
      );
      const dataDir = join(tmp, "data", "shops", "shop-test");
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(
        join(dataDir, "shop.json"),
        JSON.stringify({ id: "shop-test", componentVersions: { pkg: "2.0.0" } }, null, 2)
      );
      writeFileSync(
        join(dataDir, "history.json"),
        JSON.stringify([{ componentVersions: { pkg: "1.0.0" } }], null, 2)
      );

      execFileSync(process.execPath, [scriptPath, "shop-test"], {
        cwd: tmp,
        env: { ...process.env, PATH: `${binDir}:${process.env.PATH}`, LOG_PATH: logPath },
      });

      const log = readFileSync(logPath, "utf8").trim().split("\n");
      expect(log).toContain("--filter apps/shop-test install");
      expect(log).toContain("--filter apps/shop-test build");
      expect(log).toContain("--filter apps/shop-test deploy");

      const pkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
      expect(pkg.dependencies.pkg).toBe("1.0.0");
      const shop = JSON.parse(readFileSync(join(dataDir, "shop.json"), "utf8"));
      expect(shop.componentVersions.pkg).toBe("1.0.0");
      const history = JSON.parse(readFileSync(join(dataDir, "history.json"), "utf8"));
      expect(history.length).toBe(1);
      expect(history[0].componentVersions.pkg).toBe("2.0.0");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
