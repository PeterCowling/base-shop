#!/usr/bin/env ts-node
 
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");
const upstreamDir = join(root, "node_modules", "@shadcn", "ui", "components");
const localDir = join(root, "packages", "ui", "components", "ui");

const components = [
  "button",
  "input",
  "card",
  "checkbox",
  "dialog",
  "select",
  "table",
  "textarea",
];

for (const name of components) {
  const upstream = join(upstreamDir, `${name}.tsx`);
  const local = join(localDir, `${name}.tsx`);

  if (!existsSync(upstream)) {
    console.error(`Missing upstream component: ${upstream}`);
    continue;
  }

  console.log(`\nDiff for ${name}:`);
  spawnSync("diff", ["-u", upstream, local], { stdio: "inherit" });
}
