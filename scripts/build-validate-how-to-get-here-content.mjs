import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const ENTRY = path.resolve(ROOT, "scripts", "validate-how-to-get-here-content.ts");
const OUT_DIR = path.resolve(ROOT, "tmp");
const OUT_FILE = path.join(OUT_DIR, "validate-how-to-get-here-content.mjs");
const BIN = path.resolve(ROOT, "node_modules", ".bin", "esbuild");

await fs.mkdir(OUT_DIR, { recursive: true });

await new Promise((resolve, reject) => {
  const args = [
    "--bundle",
    "--platform=node",
    `--outfile=${OUT_FILE}`,
    "--loader:.json=json",
    "--format=esm",
    "--target=node20",
    ENTRY,
  ];
  const child = spawn(BIN, args, { stdio: "inherit" });
  child.on("exit", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`esbuild exited with ${code}`));
  });
  child.on("error", reject);
});

console.log(`Bundled validate-how-to-get-here-content → ${path.relative(ROOT, OUT_FILE)}`);