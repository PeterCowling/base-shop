import {
  updatePost as repoUpdatePost,
  slugExists,
} from "@platform-core/repositories/blog.server";
import { ensureAuthorized } from "../../../actions/common/auth";
import {
  collectProductSlugs,
  filterExistingProductSlugs,
  getConfig,
} from "../config";

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
    products = collectProductSlugs(body) ?? [];
  } catch {
    body = [];
    products = [];
  }
  const manualProductsInput = String(formData.get("products") ?? "");
  const manualProducts = manualProductsInput
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const combinedProducts = [...products, ...manualProducts];
  const existingSlugs = await filterExistingProductSlugs(
    shopId,
    combinedProducts,
  );
  products = existingSlugs === null ? combinedProducts : existingSlugs;
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
      return { error: "Slug already exists" }; // i18n-exempt: stable server error message expected by tests and UI
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
    return { message: "Post updated" }; // i18n-exempt: internal status message; tests assert exact literal
  } catch (err) {
    console.error("Failed to update post", err); // i18n-exempt: developer log, not user-facing
    return { error: "Failed to update post" }; // i18n-exempt: stable server error message expected by tests and UI
  }
}
