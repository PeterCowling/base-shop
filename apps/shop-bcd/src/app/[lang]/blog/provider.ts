import type { Shop } from "@acme/types";

type ProviderKind = "sanity" | "editorial";

export interface BlogProvider {
  kind: ProviderKind;
  fetchPublishedPosts: (shopId: string) => Promise<
    { title: string; slug: string; excerpt?: string; products?: string[]; categories?: string[]; date?: string }[]
  >;
  fetchPostBySlug: (
    shopId: string,
    slug: string,
  ) => Promise<
    | {
        // Sanity shape
        title: string;
        slug: string;
        excerpt?: string;
        author?: string;
        categories?: string[];
        products?: string[];
        body?: unknown;
      }
    | null
  >;
}

export function getBlogProvider(shop: Pick<Shop, "id" | "sanityBlog" | "editorialBlog">): BlogProvider {
  const forceEditorial = process.env.FORCE_EDITORIAL_BLOG === "1";
  if (!forceEditorial && shop.sanityBlog) {
    const sanity = require("@acme/sanity") as {
      fetchPublishedPosts: BlogProvider["fetchPublishedPosts"];
      fetchPostBySlug: BlogProvider["fetchPostBySlug"];
    };
    return {
      kind: "sanity",
      fetchPublishedPosts: sanity.fetchPublishedPosts,
      fetchPostBySlug: sanity.fetchPostBySlug,
    } satisfies BlogProvider;
  }
  if (shop.editorialBlog?.enabled) {
    const editorial = require("@acme/editorial") as {
      fetchPublishedPosts: BlogProvider["fetchPublishedPosts"];
      fetchPostBySlug: BlogProvider["fetchPostBySlug"];
    };
    return {
      kind: "editorial",
      fetchPublishedPosts: editorial.fetchPublishedPosts,
      fetchPostBySlug: editorial.fetchPostBySlug,
    } satisfies BlogProvider;
  }
  return {
    kind: "editorial",
    async fetchPublishedPosts() { return []; },
    async fetchPostBySlug() { return null; },
  } satisfies BlogProvider;
}
