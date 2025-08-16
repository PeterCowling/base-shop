import "server-only";
import type { SanityBlogConfig } from "@acme/types";
export interface ProductBlock {
    _type: "productReference";
    slug: string;
}
export interface BlogPost {
    title: string;
    slug: string;
    excerpt?: string;
    body?: (unknown | ProductBlock)[];
    mainImage?: string;
    author?: string;
    categories?: string[];
    products?: string[];
}
export declare function getConfig(shopId: string): Promise<SanityBlogConfig>;
export declare function fetchPublishedPosts(shopId: string): Promise<BlogPost[]>;
export declare function fetchPostBySlug(shopId: string, slug: string): Promise<BlogPost | null>;
export declare function publishQueuedPost(shopId: string): Promise<void>;
