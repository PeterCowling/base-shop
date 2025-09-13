import { execFileSync } from "child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import ts from "typescript";

describe("republish-shop script", () => {
  it("builds, deploys and updates status", () => {
    const tmp = mkdtempSync(join(tmpdir(), "republish-"));
    try {
      const scriptsDir = join(tmp, "scripts");
      mkdirSync(scriptsDir, { recursive: true });
      const source = readFileSync(
        join(__dirname, "../../../scripts/src/republish-shop.ts"),
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
      const scriptPath = join(scriptsDir, "republish-shop.js");
      writeFileSync(scriptPath, js);

      const binDir = join(tmp, "bin");
      mkdirSync(binDir);
      const logPath = join(tmp, "pnpm.log");
      writeFileSync(
        join(binDir, "pnpm"),
        `#!/usr/bin/env node\nconst fs=require("fs");fs.appendFileSync(process.env.LOG_PATH, process.argv.slice(2).join(" ")+"\\n");`
      );
      chmodSync(join(binDir, "pnpm"), 0o755);

      const appDir = join(tmp, "apps", "shop-test");
      mkdirSync(appDir, { recursive: true });
      writeFileSync(
        join(appDir, "package.json"),
        JSON.stringify({ dependencies: { comp: "1.0.0" } }, null, 2)
      );
      const dataDir = join(tmp, "data", "shops", "shop-test");
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(join(dataDir, "upgrade.json"), JSON.stringify({ ok: true }));
      writeFileSync(join(dataDir, "shop.json"), JSON.stringify({ id: "shop-test" }, null, 2));

      execFileSync(process.execPath, [scriptPath, "shop-test"], {
        cwd: tmp,
        env: { ...process.env, PATH: `${binDir}:${process.env.PATH}`, LOG_PATH: logPath },
      });

      const log = readFileSync(logPath, "utf8").trim().split("\n");
      expect(log).toContain("--filter apps/shop-test build");
      expect(log).toContain("--filter apps/shop-test deploy");
      const final = JSON.parse(readFileSync(join(dataDir, "shop.json"), "utf8"));
      expect(final.status).toBe("published");
      expect(final.componentVersions).toEqual({ comp: "1.0.0" });
      expect(existsSync(join(dataDir, "upgrade.json"))).toBe(false);
      expect(existsSync(join(dataDir, "audit.log"))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("builds, deploys and updates status without upgrade.json", () => {
    const tmp = mkdtempSync(join(tmpdir(), "republish-edit-"));
    try {
      const scriptsDir = join(tmp, "scripts");
      mkdirSync(scriptsDir, { recursive: true });
      const source = readFileSync(
        join(__dirname, "../../../scripts/src/republish-shop.ts"),
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
      const scriptPath = join(scriptsDir, "republish-shop.js");
      writeFileSync(scriptPath, js);

      const binDir = join(tmp, "bin");
      mkdirSync(binDir);
      const logPath = join(tmp, "pnpm.log");
      writeFileSync(
        join(binDir, "pnpm"),
        `#!/usr/bin/env node\nconst fs=require("fs");fs.appendFileSync(process.env.LOG_PATH, process.argv.slice(2).join(" ")+"\\n");`
      );
      chmodSync(join(binDir, "pnpm"), 0o755);

      const appDir = join(tmp, "apps", "shop-edit");
      mkdirSync(appDir, { recursive: true });
      writeFileSync(
        join(appDir, "package.json"),
        JSON.stringify({ dependencies: { comp: "1.0.0" } }, null, 2)
      );
      const dataDir = join(tmp, "data", "shops", "shop-edit");
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(join(dataDir, "shop.json"), JSON.stringify({ id: "shop-edit" }, null, 2));

      execFileSync(process.execPath, [scriptPath, "shop-edit"], {
        cwd: tmp,
        env: { ...process.env, PATH: `${binDir}:${process.env.PATH}`, LOG_PATH: logPath },
      });

      const log = readFileSync(logPath, "utf8").trim().split("\n");
      expect(log).toContain("--filter apps/shop-edit build");
      expect(log).toContain("--filter apps/shop-edit deploy");
      const final = JSON.parse(readFileSync(join(dataDir, "shop.json"), "utf8"));
      expect(final.status).toBe("published");
      expect(final.componentVersions).toEqual({ comp: "1.0.0" });
      expect(existsSync(join(dataDir, "audit.log"))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
