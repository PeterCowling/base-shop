/**
 * Walk upward from the current working directory to locate the monorepo-level
 * `data/shops` folder. Falls back to `<cwd>/data/shops` if the search reaches
 * the filesystem root without a hit.
 */
export declare function resolveDataRoot(): string;
export declare const DATA_ROOT: string;
//# sourceMappingURL=dataRoot.d.ts.map