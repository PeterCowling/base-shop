import type { SegmentDef } from "./filters";

export declare function readSegments(shop: string): Promise<SegmentDef[]>;
export declare function cacheTtl(): number;
export declare function analyticsMTime(shop: string): Promise<number>;
export declare class SegmentCache {
    private ttlMs;
    private cache;
    constructor(ttlMs?: number);
    get(key: string, mtime: number): string[] | undefined;
    set(key: string, mtime: number, emails: string[]): void;
}
//# sourceMappingURL=storage.d.ts.map
