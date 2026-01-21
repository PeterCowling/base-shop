import "server-only";

import { type SanityConfig,slugExists } from "@acme/plugin-sanity";
import type { SanityPostCreate, SanityPostUpdate } from "@acme/types";

export interface SanityPost {
    _id: string;
    title?: string;
    body?: string;
    published?: boolean;
    publishedAt?: string;
    slug?: string;
    excerpt?: string;
    mainImage?: string;
    author?: string;
    categories?: string[];
    products?: string[];
}
export declare function listPosts(config: SanityConfig): Promise<SanityPost[]>;
export declare function getPost(config: SanityConfig, id: string): Promise<SanityPost | null>;
export declare function createPost(config: SanityConfig, doc: SanityPostCreate): Promise<string | undefined>;
export declare function updatePost(config: SanityConfig, id: string, set: SanityPostUpdate): Promise<void>;
export declare function publishPost(config: SanityConfig, id: string, publishedAt: string): Promise<void>;
export declare function unpublishPost(config: SanityConfig, id: string): Promise<void>;
export declare function deletePost(config: SanityConfig, id: string): Promise<void>;
export { slugExists };
export type { SanityConfig };
