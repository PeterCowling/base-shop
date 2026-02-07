/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] uploader repo utilities pending security audit */

import fs from "node:fs";
import path from "node:path";

export function resolveRepoRoot(startDir = process.cwd()): string {
  let current = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(current, "pnpm-workspace.yaml"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(startDir);
    current = parent;
  }
}
