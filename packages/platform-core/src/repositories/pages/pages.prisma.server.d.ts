import "server-only";

import { type Page } from "@acme/types";

export declare function getPages(shop: string): Promise<Page[]>;
export declare function savePage(shop: string, page: Page, previous?: Page): Promise<Page>;
export declare function deletePage(shop: string, id: string): Promise<void>;
export declare function updatePage(shop: string, patch: Partial<Page> & { id: string; updatedAt: string; }, previous: Page): Promise<Page>;
export interface PageDiffEntry {
    timestamp: string;
    diff: Partial<Page>;
}
export declare function diffHistory(shop: string): Promise<PageDiffEntry[]>;
