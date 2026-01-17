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

const mkdirSafe = (dir: string, options?: Parameters<typeof mkdirSync>[1]) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-3109: temp workspace under controlled mkdtemp
  return mkdirSync(dir, options);
};

const writeFileSafe = (file: string, contents: string) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-3109: temp workspace under controlled mkdtemp
  return writeFileSync(file, contents);
};

const chmodSafe = (file: string, mode: number) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-3109: temp workspace under controlled mkdtemp
  return chmodSync(file, mode);
};

const readFileSafe = (file: string) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-3109: temp workspace under controlled mkdtemp
  return readFileSync(file, "utf8");
};

describe("rollback-shop script", () => {
  it("restores previous component versions and updates metadata", () => {
    const tmp = mkdtempSync(join(tmpdir(), "rollback-"));
    try {
      const scriptsDir = join(tmp, "scripts");
      mkdirSafe(scriptsDir, { recursive: true });
      const source = readFileSafe(join(__dirname, "../../../scripts/src/rollback-shop.ts"));
      const js = ts
        .transpileModule(source, {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2019,
          },
        })
        .outputText;
      const scriptPath = join(scriptsDir, "rollback-shop.js");
      writeFileSafe(scriptPath, js);

      const binDir = join(tmp, "bin");
      mkdirSafe(binDir);
      const logPath = join(tmp, "pnpm.log");
      writeFileSafe(
        join(binDir, "pnpm"),
        `#!/usr/bin/env node\nconst fs=require('fs');fs.appendFileSync(process.env.LOG_PATH, process.argv.slice(2).join(" ")+"\\n");`
      );
      chmodSafe(join(binDir, "pnpm"), 0o755);

      const acmeLibDir = join(tmp, "node_modules", "@acme", "lib");
      mkdirSafe(acmeLibDir, { recursive: true });
      writeFileSafe(
        join(acmeLibDir, "index.js"),
        "exports.validateShopName = (id) => id;",
      );
      writeFileSafe(
        join(acmeLibDir, "package.json"),
        JSON.stringify({ name: "@acme/lib", version: "0.0.0", main: "index.js" }, null, 2),
      );

      const appDir = join(tmp, "apps", "shop-test");
      mkdirSafe(appDir, { recursive: true });
      writeFileSafe(
        join(appDir, "package.json"),
        JSON.stringify({ dependencies: { pkg: "2.0.0" } }, null, 2)
      );
      const dataDir = join(tmp, "data", "shops", "shop-test");
      mkdirSafe(dataDir, { recursive: true });
      writeFileSafe(
        join(dataDir, "shop.json"),
        JSON.stringify({ id: "shop-test", componentVersions: { pkg: "2.0.0" } }, null, 2)
      );
      writeFileSafe(
        join(dataDir, "history.json"),
        JSON.stringify([{ componentVersions: { pkg: "1.0.0" } }], null, 2)
      );

      execFileSync(process.execPath, [scriptPath, "shop-test"], {
        cwd: tmp,
        env: {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH}`,
          LOG_PATH: logPath,
          NODE_PATH: join(__dirname, "../../..", "node_modules"),
        },
      });

      const log = readFileSafe(logPath).trim().split("\n");
      expect(log).toContain("--filter apps/shop-test install");
      expect(log).toContain("--filter apps/shop-test build");
      expect(log).toContain("--filter apps/shop-test deploy");

      const pkg = JSON.parse(readFileSafe(join(appDir, "package.json")));
      expect(pkg.dependencies.pkg).toBe("1.0.0");
      const shop = JSON.parse(readFileSafe(join(dataDir, "shop.json")));
      expect(shop.componentVersions.pkg).toBe("1.0.0");
      const history = JSON.parse(readFileSafe(join(dataDir, "history.json")));
      expect(history.length).toBe(2);
      expect(history[0].componentVersions.pkg).toBe("1.0.0");
      expect(history[1].componentVersions.pkg).toBe("2.0.0");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
