import { getSanityConfig } from "@platform-core/src/shops";
import { getShopById } from "@platform-core/src/repositories/shop.server";
import {
  listPosts,
  getPost as repoGetPost,
  createPost as repoCreatePost,
  updatePost as repoUpdatePost,
  publishPost as repoPublishPost,
  unpublishPost as repoUnpublishPost,
  deletePost as repoDeletePost,
  slugExists,
  type SanityPost,
  type SanityConfig,
} from "@platform-core/src/repositories/blog.server";
import { ensureAuthorized } from "../actions/common/auth";
import { nowIso } from "@date-utils";

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

async function filterExistingProductSlugs(shopId: string, slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  try {
    const res = await fetch(`/api/products/${shopId}/slugs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
    });
    if (!res.ok) return [];
    const existing = await res.json();
    return Array.isArray(existing) ? existing : [];
  } catch {
    return [];
  }
}

async function getConfig(shopId: string): Promise<SanityConfig> {
  const shop = await getShopById(shopId);
  const sanity = getSanityConfig(shop);
  if (!sanity) {
    throw new Error(`Missing Sanity config for shop ${shopId}`);
  }
  return sanity;
}

export async function getPosts(shopId: string): Promise<SanityPost[]> {
  await ensureAuthorized();
  const config = await getConfig(shopId);
  return listPosts(config);
}

export async function getPost(shopId: string, id: string): Promise<SanityPost | null> {
  await ensureAuthorized();
  const config = await getConfig(shopId);
  return repoGetPost(config, id);
}

export async function createPost(
  shopId: string,
  formData: FormData,
): Promise<{ message?: string; error?: string; id?: string }> {
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
  const manualProductsInput = String(formData.get("products") ?? "");
  const manualProducts = manualProductsInput
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const existingSlugs = await filterExistingProductSlugs(shopId, [
    ...products,
    ...manualProducts,
  ]);
  products = existingSlugs;
  const slug = String(formData.get("slug") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "");
  const mainImage = String(formData.get("mainImage") ?? "");
  const author = String(formData.get("author") ?? "");
  const categoriesInput = String(formData.get("categories") ?? "");
  const categories = categoriesInput
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const publishedAtInput = formData.get("publishedAt");
  const publishedAt = publishedAtInput
    ? new Date(String(publishedAtInput)).toISOString()
    : undefined;
  try {
    if (slug && (await slugExists(config, slug))) {
      return { error: "Slug already exists" };
    }
    const id = await repoCreatePost(config, {
      _type: "post",
      title,
      body,
      products,
      published: false,
      slug: slug ? { current: slug } : undefined,
      excerpt: excerpt || undefined,
      mainImage: mainImage || undefined,
      author: author || undefined,
      ...(categories.length ? { categories } : {}),
      ...(publishedAt ? { publishedAt } : {}),
    });
    return { message: "Post created", id };
  } catch (err) {
    console.error("Failed to create post", err);
    return { error: "Failed to create post" };
  }
}

export async function updatePost(
  shopId: string,
  formData: FormData,
): Promise<{ message?: string; error?: string }> {
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
  const manualProductsInput = String(formData.get("products") ?? "");
  const manualProducts = manualProductsInput
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const existingSlugs = await filterExistingProductSlugs(shopId, [
    ...products,
    ...manualProducts,
  ]);
  products = existingSlugs;
  const slug = String(formData.get("slug") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "");
  const mainImage = String(formData.get("mainImage") ?? "");
  const author = String(formData.get("author") ?? "");
  const categoriesInput = String(formData.get("categories") ?? "");
  const categories = categoriesInput
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const publishedAtInput = formData.get("publishedAt");
  const publishedAt = publishedAtInput
    ? new Date(String(publishedAtInput)).toISOString()
    : undefined;
  try {
    if (slug && (await slugExists(config, slug, id))) {
      return { error: "Slug already exists" };
    }
    await repoUpdatePost(config, id, {
      title,
      body,
      products,
      slug: slug ? { current: slug } : undefined,
      excerpt: excerpt || undefined,
      mainImage: mainImage || undefined,
      author: author || undefined,
      ...(categories.length ? { categories } : {}),
      ...(publishedAt ? { publishedAt } : {}),
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
  formData?: FormData,
): Promise<{ message?: string; error?: string }> {
  await ensureAuthorized();
  const config = await getConfig(shopId);
  const publishedAtInput = formData?.get("publishedAt");
  const publishedAt = publishedAtInput
    ? new Date(String(publishedAtInput)).toISOString()
    : nowIso();
  try {
    await repoPublishPost(config, id, publishedAt);
    return { message: "Post published" };
  } catch (err) {
    console.error("Failed to publish post", err);
    return { error: "Failed to publish post" };
  }
}

export async function unpublishPost(
  shopId: string,
  id: string,
): Promise<{ message?: string; error?: string }> {
  await ensureAuthorized();
  const config = await getConfig(shopId);
  try {
    await repoUnpublishPost(config, id);
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
  await ensureAuthorized();
  const config = await getConfig(shopId);
  try {
    await repoDeletePost(config, id);
    return { message: "Post deleted" };
  } catch (err) {
    console.error("Failed to delete post", err);
    return { error: "Failed to delete post" };
  }
}

export type { SanityPost };
