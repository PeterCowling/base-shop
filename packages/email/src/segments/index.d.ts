import "server-only";

import type { SegmentDef } from "./filters";
import { addToList, createContact, listSegments } from "./providers";
import { analyticsMTime, cacheTtl,readSegments, SegmentCache } from "./storage";

export { addToList, analyticsMTime, cacheTtl,createContact, listSegments, readSegments, SegmentCache };
export type { SegmentDef };
export declare function resolveSegment(shop: string, id: string): Promise<string[]>;
//# sourceMappingURL=index.d.ts.map
