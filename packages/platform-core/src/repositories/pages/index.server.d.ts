import "server-only";

import { type Page } from "@acme/types";
/** Return all pages for a shop, or an empty array if none exist */
export declare function getPages(shop: string): Promise<Page[]>;
/** Create or overwrite an entire Page record */
export declare function savePage(shop: string, page: Page, previous?: Page): Promise<Page>;
/** Delete a page by ID */
export declare function deletePage(shop: string, id: string): Promise<void>;
/** Patch a page. Only defined keys in `patch` are applied. */
export declare function updatePage(shop: string, patch: Partial<Page> & {
    id: string;
    updatedAt: string;
}, previous: Page): Promise<Page>;
export interface PageDiffEntry {
    timestamp: string;
    diff: Partial<Page>;
}
export declare function diffHistory(shop: string): Promise<PageDiffEntry[]>;
