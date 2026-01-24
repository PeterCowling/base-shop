import { type PageItem } from "./types";

export async function fetchPages(shop: string): Promise<PageItem[]> {
  const res = await fetch(`/cms/api/pages/${shop}`);
  if (!res.ok) return [];
  const list = (await res.json()) as unknown[];
  return list.map((p) => normalizePageItem(p));
}

export async function updateOrder(shop: string, ids: string[]): Promise<boolean> {
  const res = await fetch(`/cms/api/pages/${shop}/order`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  return res.ok || res.status === 204;
}

export async function createPage(shop: string, title: string): Promise<PageItem | null> {
  const res = await fetch(`/cms/api/pages/${shop}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, locale: "en" }),
  });
  if (!res.ok) return null;
  return (await res.json()) as PageItem;
}

export async function patchPage(
  shop: string,
  id: string,
  body: Partial<PageItem> & { seo?: PageItem["seo"]; visibility?: PageItem["visibility"]; slug?: string; updatedAt?: string },
): Promise<{ ok: boolean; status: number; item?: PageItem }> {
  const res = await fetch(`/cms/api/pages/${shop}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  try {
    const p = (await res.json()) as PageItem;
    return { ok: true, status: res.status, item: p };
  } catch {
    return { ok: true, status: res.status };
  }
}

function normalizePageItem(p: unknown): PageItem {
  const raw = p as Record<string, unknown>;
  const rawSeo = (raw["seo"] as Record<string, unknown> | undefined) ?? {};
  const image = typeof rawSeo["image"] === "string"
    ? (rawSeo["image"] as string)
    : ((rawSeo["image"] as Record<string, unknown> | undefined)?.["url"] as string | undefined) ?? "";
  const seo = { ...rawSeo, image } as PageItem["seo"];
  return {
    id: String((raw["id"] ?? raw["slug"] ?? Math.random().toString(36).slice(2, 9)) as string),
    slug: String((raw["slug"] ?? raw["path"] ?? "") as string),
    title: raw["title"] as string | undefined,
    seo,
    visibility: raw["visibility"] as PageItem["visibility"] | undefined,
    updatedAt: raw["updatedAt"] as string | undefined,
  } satisfies PageItem;
}
