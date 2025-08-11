import "server-only";
import { createClient } from "@sanity/client";
import { getSanityConfig } from "@platform-core/shops";
import { getShopById } from "@platform-core/repositories/shop.server";
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
}

export async function getConfig(shopId: string): Promise<SanityBlogConfig> {
  const shop = await getShopById(shopId);
  const config = getSanityConfig(shop);
  if (!config) {
    throw new Error(`Missing Sanity credentials for shop ${shopId}`);
  }
  return config;
}

async function getClient(shopId: string) {
  const { projectId, dataset, token: sanityToken } = await getConfig(shopId);
  return createClient({
    projectId,
    dataset,
    token: sanityToken,
    apiVersion: "2023-01-01",
    useCdn: true,
  });
}

export async function fetchPublishedPosts(shopId: string): Promise<BlogPost[]> {
  try {
    const client = await getClient(shopId);
    const query = `*[_type == "post" && defined(slug.current) && published == true && !(_id in path('drafts.**'))]{title, "slug": slug.current, excerpt}`;
    const posts = await client.fetch<BlogPost[]>(query);
    return posts;
  } catch {
    return [];
  }
}

export async function fetchPostBySlug(
  shopId: string,
  slug: string,
): Promise<BlogPost | null> {
  try {
    const client = await getClient(shopId);
    const query = `*[_type == "post" && slug.current == $slug && published == true][0]{title, "slug": slug.current, excerpt, body[]{..., _type == "productReference" => { _type, slug }}}`;
    const post = await client.fetch<BlogPost | null>(query, { slug });
    return post;
  } catch {
    return null;
  }
}
