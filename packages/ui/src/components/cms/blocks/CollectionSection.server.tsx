import type { SKU } from "@acme/types";
import CollectionSectionClient from "./CollectionSection.client";

export interface CollectionServerProps {
  params: { lang: string; slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
  paginationMode?: "loadMore" | "ssr";
  pageSize?: number;
  seoText?: string;
  seoCollapsible?: boolean;
}

async function fetchInitial(slug: string, searchParams?: Record<string, string | string[] | undefined>): Promise<SKU[]> {
  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost"}/api/collections/${encodeURIComponent(slug)}`);
  const sort = typeof searchParams?.sort === "string" ? searchParams?.sort : undefined;
  if (sort) url.searchParams.set("sort", sort);
  const page = typeof searchParams?.page === "string" ? searchParams.page : undefined;
  const pageSize = typeof searchParams?.pageSize === "string" ? searchParams.pageSize : undefined;
  if (page) url.searchParams.set("page", page);
  if (pageSize) url.searchParams.set("pageSize", pageSize);
  const res = await fetch(url.toString(), { next: { revalidate: 60, tags: ["collections", `collection:${slug}`] } as any });
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: SKU[] } | SKU[];
  return Array.isArray(data) ? data : (data.items ?? []);
}

export default async function CollectionSectionServer({ params, searchParams, paginationMode = "loadMore", pageSize = 12, seoText, seoCollapsible = true }: CollectionServerProps) {
  const initial = await fetchInitial(params.slug, searchParams);
  const flatParams: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(searchParams ?? {})) flatParams[k] = Array.isArray(v) ? v[0] : v;
  return <CollectionSectionClient initial={initial} params={{ slug: params.slug, ...flatParams }} paginationMode={paginationMode} pageSize={pageSize} seoText={seoText} seoCollapsible={seoCollapsible} />;
}
