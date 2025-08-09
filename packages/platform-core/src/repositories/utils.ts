import "server-only";

import * as fsSync from "node:fs";
import * as path from "node:path";

export { loadThemeTokens } from "../themeTokens";

export function resolveDataRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}

export const DATA_ROOT = resolveDataRoot();
