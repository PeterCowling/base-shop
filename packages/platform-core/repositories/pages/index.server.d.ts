import "server-only";
import { type Page } from "@types";
export declare function getPages(shop: string): Promise<Page[]>;
export declare function savePage(shop: string, page: Page): Promise<Page>;
export declare function deletePage(shop: string, id: string): Promise<void>;
export declare function updatePage(shop: string, patch: Partial<Page> & {
    id: string;
    updatedAt: string;
}): Promise<Page>;
//# sourceMappingURL=index.server.d.ts.map