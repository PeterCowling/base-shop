// apps/cms/src/actions/blog.server.ts

import { getSanityConfig } from "@platform-core/src/shops";
import { getShopById } from "@platform-core/src/repositories/shop.server";
import { env } from "@acme/config";
import { ensureAuthorized } from "./common/auth";

const apiVersion = env.SANITY_API_VERSION || "2021-10-21";

function collectProductSlugs(content: unknown): string[] {
  const slugs = new Set<string>();
  const walk = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "object") {
      if (node._type === "productReference" && typeof node.slug === "string") {
        slugs.add(node.slug);
      }
      for (const value of Object.values(node)) {
        walk(value);
      }
    }
  };
  walk(content);
  return Array.from(slugs);
}

interface SanityPost {
  _id: string;
  title?: string;
  body?: string;
  published?: boolean;
  publishedAt?: string;
  slug?: string;
  excerpt?: string;
}

interface Config {
  projectId: string;
  dataset: string;
  token?: string;
  apiVersion: string;
}

async function getConfig(shopId: string): Promise<Config> {
  const shop = await getShopById(shopId);
  const sanity = getSanityConfig(shop);
  if (!sanity) {
    throw new Error(`Missing Sanity config for shop ${shopId}`);
  }
  return { ...sanity, apiVersion };
}

function queryUrl(config: Config, query: string) {
  return `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/query/${config.dataset}?query=${encodeURIComponent(query)}`;
}

async function mutate(config: Config, body: unknown) {
  const url = `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/mutate/${config.dataset}`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function slugExists(config: Config, slug: string, excludeId?: string) {
  const query = `*[_type=="post" && slug.current=="${slug}"${excludeId ? ` && _id!="${excludeId}"` : ""}][0]{_id}`;
  const res = await fetch(
    queryUrl(config, query),
    { headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined }
  );
  const json = await res.json();
  return Boolean(json.result);
}

export async function getPosts(shopId: string): Promise<SanityPost[]> {
  await ensureAuthorized();
  const config = await getConfig(shopId);
  const res = await fetch(
    queryUrl(
      config,
      '*[_type=="post"]{_id,title,body,published,publishedAt,"slug":slug.current,excerpt}',
    ),
    { headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined }
  );
  const json = await res.json();
  return json.result ?? [];
}

export async function getPost(
  shopId: string,
  id: string
): Promise<SanityPost | null> {
  await ensureAuthorized();
  const config = await getConfig(shopId);
  const res = await fetch(
    queryUrl(
      config,
      `*[_type=="post" && _id=="${id}"][0]{_id,title,body,published,publishedAt,"slug":slug.current,excerpt}`,
    ),
    { headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined }
  );
  const json = await res.json();
  return json.result ?? null;
}

export async function createPost(
  shopId: string,
  _prev: unknown,
  formData: FormData
): Promise<{ message?: string; error?: string; id?: string }> {
  "use server";
  await ensureAuthorized();
  const config = await getConfig(shopId);
  const title = String(formData.get("title") ?? "");
  const content = String(formData.get("content") ?? "[]");
  let body: unknown = [];
  let products: string[] = [];
  try {
    body = JSON.parse(content);
    products = collectProductSlugs(body);
  } catch {
    body = [];
    products = [];
  }
  const slug = String(formData.get("slug") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "");
  const publishedAtInput = formData.get("publishedAt");
  const publishedAt = publishedAtInput
    ? new Date(String(publishedAtInput)).toISOString()
    : undefined;
  try {
    if (slug && (await slugExists(config, slug))) {
      return { error: "Slug already exists" };
    }
    const res = await mutate(config, {
      mutations: [
        {
          create: {
            _type: "post",
            title,
            body,
            products,
            published: false,
            slug: slug ? { current: slug } : undefined,
            excerpt: excerpt || undefined,
            ...(publishedAt ? { publishedAt } : {}),
          },
        },
      ],
      returnIds: true,
    });
    const json = await res.json();
    const id = json?.results?.[0]?.id as string | undefined;
    return { message: "Post created", id };
  } catch (err) {
    console.error("Failed to create post", err);
    return { error: "Failed to create post" };
  }
}

export async function updatePost(
  shopId: string,
  _prev: unknown,
  formData: FormData
): Promise<{ message?: string; error?: string }> {
  "use server";
  await ensureAuthorized();
  const config = await getConfig(shopId);
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const content = String(formData.get("content") ?? "[]");
  let body: unknown = [];
  let products: string[] = [];
  try {
    body = JSON.parse(content);
    products = collectProductSlugs(body);
  } catch {
    body = [];
    products = [];
  }
  const slug = String(formData.get("slug") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "");
  const publishedAtInput = formData.get("publishedAt");
  const publishedAt = publishedAtInput
    ? new Date(String(publishedAtInput)).toISOString()
    : undefined;
  try {
    if (slug && (await slugExists(config, slug, id))) {
      return { error: "Slug already exists" };
    }
    await mutate(config, {
      mutations: [
        {
          patch: {
            id,
            set: {
              title,
              body,
              products,
              slug: slug ? { current: slug } : undefined,
              excerpt: excerpt || undefined,
              ...(publishedAt ? { publishedAt } : {}),
            },
          },
        },
      ],
    });
    return { message: "Post updated" };
  } catch (err) {
    console.error("Failed to update post", err);
    return { error: "Failed to update post" };
  }
}

export async function publishPost(
  shopId: string,
  id: string,
  _prev?: unknown,
  formData?: FormData
): Promise<{ message?: string; error?: string }> {
  "use server";
  await ensureAuthorized();
  const config = await getConfig(shopId);
  const publishedAtInput = formData?.get("publishedAt");
  const publishedAt = publishedAtInput
    ? new Date(String(publishedAtInput)).toISOString()
    : new Date().toISOString();
  try {
    await mutate(config, {
      mutations: [{ patch: { id, set: { published: true, publishedAt } } }],
    });
    return { message: "Post published" };
  } catch (err) {
    console.error("Failed to publish post", err);
    return { error: "Failed to publish post" };
  }
}

export async function unpublishPost(
  shopId: string,
  id: string,
  _prev?: unknown,
  _formData?: FormData,
): Promise<{ message?: string; error?: string }> {
  "use server";
  await ensureAuthorized();
  const config = await getConfig(shopId);
  try {
    await mutate(config, {
      mutations: [{ patch: { id, set: { published: false }, unset: ["publishedAt"] } }],
    });
    return { message: "Post unpublished" };
  } catch (err) {
    console.error("Failed to unpublish post", err);
    return { error: "Failed to unpublish post" };
  }
}

export async function deletePost(
  shopId: string,
  id: string,
): Promise<{ message?: string; error?: string }> {
  "use server";
  await ensureAuthorized();
  const config = await getConfig(shopId);
  try {
    await mutate(config, { mutations: [{ delete: { id } }] });
    return { message: "Post deleted" };
  } catch (err) {
    console.error("Failed to delete post", err);
    return { error: "Failed to delete post" };
  }
}

export type { SanityPost };
