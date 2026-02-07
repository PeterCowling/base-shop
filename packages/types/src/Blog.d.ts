export interface SanityPostCreate {
    _type: "post";
    title: string;
    body: unknown;
    products: string[];
    published: boolean;
    slug?: {
        current: string;
    };
    excerpt?: string;
    mainImage?: string;
    author?: string;
    categories?: string[];
    publishedAt?: string;
}
export interface SanityPostUpdate {
    title: string;
    body: unknown;
    products: string[];
    slug?: {
        current: string;
    };
    excerpt?: string;
    mainImage?: string;
    author?: string;
    categories?: string[];
    publishedAt?: string;
}
//# sourceMappingURL=Blog.d.ts.map