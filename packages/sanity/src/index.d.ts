import "server-only";

import { type SanityBlogConfig } from "@acme/types";

export interface PortableBlock {
    _type: string;
    [key: string]: unknown;
}
export interface ProductBlock extends PortableBlock {
    _type: "productReference";
    slug: string;
}
export interface BlogPost {
    title: string;
    slug: string;
    excerpt?: string;
    body?: PortableBlock[];
    mainImage?: string;
    author?: string;
    categories?: string[];
    products?: string[];
}
export declare function getConfig(shopId: string): Promise<SanityBlogConfig>;
export declare function fetchPublishedPosts(shopId: string): Promise<BlogPost[]>;
export declare function fetchPostBySlug(shopId: string, slug: string): Promise<BlogPost | null>;
export declare function publishQueuedPost(shopId: string): Promise<void>;
//# sourceMappingURL=index.d.ts.map