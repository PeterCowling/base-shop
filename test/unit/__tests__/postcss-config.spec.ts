import { expect, it } from "@jest/globals";
import { existsSync, readdirSync } from "fs";
import { join } from "path";

const rootDir = join(__dirname, "../../..", "");
const rootConfig = require(join(rootDir, "postcss.config.cjs"));

const appsDir = join(rootDir, "apps");

for (const entry of readdirSync(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const appPath = join(appsDir, entry.name);
  const cjsPath = join(appPath, "postcss.config.cjs");
  const mjsPath = join(appPath, "postcss.config.mjs");

  it(`${entry.name} has postcss config that loads root`, async () => {
    let config: any;
    if (existsSync(cjsPath)) {
      config = require(cjsPath);
    } else if (existsSync(mjsPath)) {
      const mod = await import(mjsPath);
      config = mod.default ?? mod;
    } else {
      throw new Error(`No postcss config found in ${entry.name}`);
    }
    expect(config).toEqual(rootConfig);
  });
}
