import type { SKU } from "@acme/types";
import CollectionSectionClient from "./CollectionSection.client";

export interface CollectionServerProps {
  params: { lang: string; slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

async function fetchInitial(slug: string, searchParams?: Record<string, string | string[] | undefined>): Promise<SKU[]> {
  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost"}/api/collections/${encodeURIComponent(slug)}`);
  const sort = typeof searchParams?.sort === "string" ? searchParams?.sort : undefined;
  if (sort) url.searchParams.set("sort", sort);
  const res = await fetch(url.toString(), { next: { revalidate: 60, tags: ["collections", `collection:${slug}`] } as any });
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: SKU[] } | SKU[];
  return Array.isArray(data) ? data : (data.items ?? []);
}

export default async function CollectionSectionServer({ params, searchParams }: CollectionServerProps) {
  const initial = await fetchInitial(params.slug, searchParams);
  const flatParams: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(searchParams ?? {})) flatParams[k] = Array.isArray(v) ? v[0] : v;
  return <CollectionSectionClient initial={initial} params={{ slug: params.slug, ...flatParams }} />;
}

