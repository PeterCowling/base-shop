import "server-only";

import { createClient } from "@sanity/client";

import { nowIso } from "@acme/date-utils";
import { getShopById } from "@acme/platform-core/repositories/shop.server";
import { getSanityConfig } from "@acme/platform-core/shops";
import { type SanityBlogConfig,sanityBlogConfigSchema } from "@acme/types";

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

export async function getConfig(shopId: string): Promise<SanityBlogConfig> {
  const shop = await getShopById(shopId);
  const config = getSanityConfig(shop);
  if (!config) {
    throw new Error(`Missing Sanity credentials for shop ${shopId}`);
  }
  return sanityBlogConfigSchema.parse(config);
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
    const query = `*[_type == "post" && defined(slug.current) && published == true && !(_id in path('drafts.**'))]{title, "slug": slug.current, excerpt, mainImage, author, categories, products}`;
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
    const query = `*[_type == "post" && slug.current == $slug && published == true][0]{title, "slug": slug.current, excerpt, mainImage, author, categories, products, body[]{..., _type == "productReference" => { _type, slug }}}`;
    const post = await client.fetch<BlogPost | null>(query, { slug });
    return post;
  } catch {
    return null;
  }
}

export async function publishQueuedPost(shopId: string): Promise<void> {
  try {
    const client = await getClient(shopId);
    const next = await client.fetch<{ _id: string } | null>(
      `*[_type == "post" && published != true && !(_id in path('drafts.**'))]|order(_createdAt asc)[0]{_id}`,
    );
    if (!next?._id) return;
    await client
      .patch(next._id)
      .set({ published: true, publishedAt: nowIso() })
      .commit();
  } catch {
    // swallow errors; scheduled job will handle logging
  }
}
