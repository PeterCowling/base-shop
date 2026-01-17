import { getSanityConfig } from "@acme/platform-core/shops";
import { getShopById } from "@acme/platform-core/repositories/shop.server";
import type { SanityConfig } from "@acme/platform-core/repositories/blog.server";

export async function getConfig(shopId: string): Promise<SanityConfig> {
  const shop = await getShopById(shopId);
  const sanity = getSanityConfig(shop) as SanityConfig | undefined;
  if (!sanity) {
    throw new Error(`Missing Sanity config for shop ${shopId}`);
  }
  return sanity;
}

export function collectProductSlugs(content: unknown): string[] {
  const slugs = new Set<string>();
  const walk = (node: unknown): void => {
    if (node == null) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "object") {
      const record = node as Record<string, unknown>;
      if (
        record._type === "productReference" &&
        typeof record.slug === "string"
      ) {
        slugs.add(record.slug);
      }
      for (const value of Object.values(record)) {
        walk(value);
      }
    }
  };
  walk(content);
  return Array.from(slugs);
}

export async function filterExistingProductSlugs(
  shopId: string,
  slugs: string[],
): Promise<string[] | null> {
  if (slugs.length === 0) return [];
  try {
    const res = await fetch(`/api/products/${shopId}/slugs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
    });
    if (!res.ok) return [];
    try {
      const existing = await res.json();
      return Array.isArray(existing) ? existing : slugs;
    } catch {
      return slugs;
    }
  } catch {
    return null;
  }
}
