import * as fsSync from "node:fs";
import * as path from "node:path";
/**
 * Walk upward from the current working directory to locate the monorepo-level
 * `data/shops` folder. Falls back to `<cwd>/data/shops` if the search reaches
 * the filesystem root without a hit. The `DATA_ROOT` environment variable may
 * be used to override the lookup path.
 */
export function resolveDataRoot() {
    const env = process.env.DATA_ROOT;
    if (env) {
        return path.resolve(env);
    }
    let dir = process.cwd();
    let found;
    while (true) {
        const candidate = path.join(dir, "data", "shops");
        if (fsSync.existsSync(candidate)) {
            found = candidate;
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return found ?? path.resolve(process.cwd(), "data", "shops");
}
export const DATA_ROOT = resolveDataRoot();
