/**
 * Copy a template application into a new shop directory.
 *
 * `node_modules` folders are skipped during the copy.
 */
export declare function copyTemplate(source: string, destination: string): void;
/** Ensure selected theme and template are available. */
export declare function ensureTemplateExists(theme: string, template: string): string;
/**
 * Read a UTF-8 text file.
 */
export declare function readFile(path: string): string;
/**
 * Write a UTF-8 text file.
 */
export declare function writeFile(path: string, content: string): void;
//# sourceMappingURL=fsUtils.d.ts.map