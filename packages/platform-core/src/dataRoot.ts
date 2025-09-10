import * as fsSync from "node:fs";
import * as path from "node:path";

const PRIVATE_PREFIX = "/private";

function stripPrivatePrefix(p: string): string {
    // macOS may resolve temporary directories under "/private" even when
    // callers provide paths starting with "/var". Normalise such paths so
    // tests comparing against the original "/var" location succeed.
    return p.startsWith(`${PRIVATE_PREFIX}/`) ? p.slice(PRIVATE_PREFIX.length) : p;
}
/**
 * Walk upward from the current working directory to locate the monorepo-level
 * `data/shops` folder. Falls back to `<cwd>/data/shops` if the search reaches
 * the filesystem root without a hit. The `DATA_ROOT` environment variable may
 * be used to override the lookup path.
 */
export function resolveDataRoot() {
    const env = process.env.DATA_ROOT;
    if (env) {
        return stripPrivatePrefix(path.resolve(env));
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
    const resolved = found ?? path.resolve(process.cwd(), "data", "shops");
    return stripPrivatePrefix(resolved);
}
export const DATA_ROOT = resolveDataRoot();
