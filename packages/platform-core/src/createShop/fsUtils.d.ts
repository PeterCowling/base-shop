/**
 * Ensure a directory exists, creating it recursively when missing.
 */
export declare function ensureDir(path: string): void;
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
/**
 * Write an object to disk as formatted JSON with trailing newline.
 */
export declare function writeJSON(path: string, data: unknown): void;
/**
 * Check if a file or directory exists.
 */
export declare function fileExists(path: string): boolean;
