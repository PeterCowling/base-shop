/**
 * Walk upward from the current working directory to locate the monorepo-level
 * `data/shops` folder. Falls back to `<cwd>/data/shops` if the search reaches
 * the filesystem root without a hit. The `DATA_ROOT` environment variable may
 * be used to override the lookup path.
 */
export declare function resolveDataRoot(): string;
export declare const DATA_ROOT: string;
