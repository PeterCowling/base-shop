import "server-only";
import { readSegments, analyticsMTime, SegmentCache, cacheTtl } from "./storage";
import { createContact, addToList, listSegments } from "./providers";
import type { SegmentDef } from "./filters";
export { createContact, addToList, listSegments, readSegments, analyticsMTime, SegmentCache, cacheTtl };
export type { SegmentDef };
export declare function resolveSegment(shop: string, id: string): Promise<string[]>;
//# sourceMappingURL=index.d.ts.map
