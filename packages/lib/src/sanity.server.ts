import "server-only";
import { createClient } from "@sanity/client";

export interface BlogPost {
  title: string;
  slug: string;
  excerpt?: string;
  body?: unknown;
}

function getConfig(shopId: string) {
  const prefix = `SANITY_${shopId.toUpperCase()}_`;
  const projectId = process.env[`${prefix}PROJECT_ID`];
  const dataset = process.env[`${prefix}DATASET`];
  const token = process.env[`${prefix}TOKEN`];
  if (!projectId || !dataset) {
    throw new Error(`Missing Sanity credentials for shop ${shopId}`);
  }
  return { projectId, dataset, token };
}

function getClient(shopId: string) {
  const { projectId, dataset, token } = getConfig(shopId);
  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: "2023-01-01",
    useCdn: true,
  });
}

export async function fetchPublishedPosts(shopId: string): Promise<BlogPost[]> {
  try {
    const client = getClient(shopId);
    const query = `*[_type == "post" && defined(slug.current) && !(_id in path('drafts.**'))]{title, "slug": slug.current, excerpt}`;
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
    const client = getClient(shopId);
    const query = `*[_type == "post" && slug.current == $slug][0]{title, "slug": slug.current, excerpt, body}`;
    const post = await client.fetch<BlogPost | null>(query, { slug });
    return post;
  } catch {
    return null;
  }
}
