import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createRequire } from "node:module";
import ts from "typescript";

describe("publish API", () => {
  it("builds, deploys and updates status", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "publish-api-"));
    const originalCwd = process.cwd();
    try {
      const scriptsDir = join(tmp, "scripts", "src");
      const routeDir = join(tmp, "apps", "shop-test", "src", "app", "api", "publish");
      mkdirSync(scriptsDir, { recursive: true });
      mkdirSync(routeDir, { recursive: true });

      const routeSource = readFileSync(
        join(__dirname, "../../../apps/shop-bcd/src/app/api/publish/route.ts"),
        "utf8"
      );
      let routeJs = ts.transpileModule(routeSource, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
      }).outputText;
      routeJs = routeJs.replace(
        /const require = \(0, module_1\.createRequire\)\(import\.meta\.url\);\n/,
        ""
      );
      writeFileSync(join(routeDir, "route.js"), routeJs);

      const calls: string[] = [];
      (globalThis as any).__calls__ = calls;
      writeFileSync(
        join(scriptsDir, "republish-shop.js"),
        `const fs=require('fs');\nconst path=require('path');\nexports.republishShop=(id)=>{\n global.__calls__.push("--filter apps/"+id+" build");\n global.__calls__.push("--filter apps/"+id+" deploy");\n const file=path.join('${tmp.replace(/\\/g, '/')}',"data","shops",id,"shop.json");\n const json=JSON.parse(fs.readFileSync(file,"utf8"));\n json.status="published";\n fs.writeFileSync(file,JSON.stringify(json,null,2));\n const ufile=path.join('${tmp.replace(/\\/g, '/')}',"data","shops",id,"upgrade.json");\n if(fs.existsSync(ufile)) fs.unlinkSync(ufile);\n};`
      );
      jest.doMock("@auth", () => ({ requirePermission: jest.fn() }), {
        virtual: true,
      });
      jest.doMock(
        "next/server",
        () => ({ NextResponse: { json: (d: any, i: any) => ({ data: d, init: i }) } }),
        { virtual: true }
      );

      const appDir = join(tmp, "apps", "shop-test");
      writeFileSync(
        join(appDir, "shop.json"),
        JSON.stringify({ id: "shop-test" }, null, 2)
      );
      const dataDir = join(tmp, "data", "shops", "shop-test");
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(join(dataDir, "upgrade.json"), JSON.stringify({ ok: true }));
      writeFileSync(join(dataDir, "shop.json"), JSON.stringify({ id: "shop-test" }, null, 2));

      process.chdir(appDir);

      const require = createRequire(__filename);
      const { POST } = require(join(routeDir, "route.js"));
      await POST();

      expect(calls).toContain("--filter apps/shop-test build");
      expect(calls).toContain("--filter apps/shop-test deploy");
      const final = JSON.parse(readFileSync(join(dataDir, "shop.json"), "utf8"));
      expect(final.status).toBe("published");
      expect(existsSync(join(dataDir, "upgrade.json"))).toBe(false);
    } finally {
      process.chdir(originalCwd);
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
