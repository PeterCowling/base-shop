/**
 * Filesystem helpers used during shop creation.
 *
 * The utilities here are intentionally small wrappers around Node's `fs`
 * functions so they can be mocked and tested in isolation.
 */
import { cpSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
/**
 * Copy a template application into a new shop directory.
 *
 * `node_modules` folders are skipped during the copy.
 */
export function copyTemplate(source, destination) {
    cpSync(source, destination, {
        recursive: true,
        filter: (src) => !/node_modules/.test(src),
    });
}
/** Ensure selected theme and template are available. */
export function ensureTemplateExists(theme, template) {
    if (!existsSync(join("packages", "themes", theme))) {
        throw new Error(`Theme '${theme}' not found in packages/themes`);
    }
    const templateApp = join("packages", template);
    if (!existsSync(templateApp)) {
        throw new Error(`Template '${template}' not found in packages`);
    }
    return templateApp;
}
/**
 * Read a UTF-8 text file.
 */
export function readFile(path) {
    return readFileSync(path, "utf8");
}
/**
 * Write a UTF-8 text file.
 */
export function writeFile(path, content) {
    writeFileSync(path, content);
}
