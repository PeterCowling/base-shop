import "server-only";

import { query, mutate, slugExists, type SanityConfig } from "@acme/plugin-sanity";
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

const POST_FIELDS = '_id,title,body,published,publishedAt,"slug":slug.current,excerpt,mainImage,author,categories,products';

export async function listPosts(config: SanityConfig): Promise<SanityPost[]> {
  const posts = await query<SanityPost[]>(config, `*[_type=="post"]{${POST_FIELDS}}`);
  return posts ?? [];
}

export async function getPost(config: SanityConfig, id: string): Promise<SanityPost | null> {
  const post = await query<SanityPost | null>(
    config,
    `*[_type=="post" && _id=="${id}"][0]{${POST_FIELDS}}`
  );
  return post ?? null;
}

export async function createPost(
  config: SanityConfig,
  doc: SanityPostCreate,
): Promise<string | undefined> {
  const result = await mutate(config, { mutations: [{ create: doc }], returnIds: true });
  return (result as any)?.results?.[0]?.id as string | undefined;
}

export async function updatePost(
  config: SanityConfig,
  id: string,
  set: SanityPostUpdate,
): Promise<void> {
  await mutate(config, { mutations: [{ patch: { id, set } }] });
}

export async function publishPost(config: SanityConfig, id: string, publishedAt: string): Promise<void> {
  await mutate(config, { mutations: [{ patch: { id, set: { published: true, publishedAt } } }] });
}

export async function unpublishPost(config: SanityConfig, id: string): Promise<void> {
  await mutate(config, { mutations: [{ patch: { id, set: { published: false }, unset: ["publishedAt"] } }] });
}

export async function deletePost(config: SanityConfig, id: string): Promise<void> {
  await mutate(config, { mutations: [{ delete: { id } }] });
}

export { slugExists };
export type { SanityConfig };
