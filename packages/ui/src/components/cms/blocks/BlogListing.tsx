"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@acme/i18n";

import { Inline } from "../../atoms/primitives/Inline";

export type BlogPost = {
  title: string;
  excerpt?: string;
  url?: string;
  shopUrl?: string;
  categories?: string[];
  date?: string;
};

export default function BlogListing({ posts = [], locale }: { posts?: BlogPost[]; locale?: string }) {
  const t = useTranslations();
  const shopStoryCta = t("blog.cta.shopStory");
  const allCategoriesLabel = t("blog.filter.all");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(() => searchParams?.get("category") ?? null);
  useEffect(() => {
    const next = searchParams?.get("category") ?? null;
    setCategory(next);
  }, [searchParams]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of posts) {
      if (Array.isArray(p.categories)) for (const c of p.categories) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [posts]);
  const filtered = useMemo(
    () => (category ? posts.filter((p) => p.categories?.includes(category)) : posts),
    [category, posts],
  );
  const fmt = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale || undefined, { year: "numeric", month: "short", day: "2-digit" });
    } catch {
      return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" });
    }
  }, [locale]);
  const updateCategory = (value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value) params.set("category", value);
    else params.delete("category");
    router.push(`?${params.toString()}`);
    setCategory(value);
  };
  if (!posts.length) return null;
  return (
    <section className="space-y-4">
      {categories.length > 1 ? (
        <Inline gap={2}>
          <button
            type="button"
            onClick={() => updateCategory(null)}
            className={`rounded border px-2 py-1 text-sm ${category ? "opacity-70" : "bg-foreground text-background"}`}
          >
            {allCategoriesLabel}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateCategory(category === c ? null : c)}
              className={`rounded border px-2 py-1 text-sm ${category === c ? "bg-foreground text-background" : "opacity-80"}`}
            >
              {c}
            </button>
          ))}
        </Inline>
      ) : null}
      {filtered.map((p) => (
        <article key={p.title} className="space-y-1">
          {p.url ? (
            <h3 className="text-lg font-semibold">
              <Link href={p.url}>{p.title}</Link>
            </h3>
          ) : (
            <h3 className="text-lg font-semibold">{p.title}</h3>
          )}
          {(Array.isArray(p.categories) && p.categories.length) || p.date ? (
            <Inline gap={2} className="text-xs text-muted">
              {Array.isArray(p.categories)
                ? p.categories.map((c) => (
                    <span key={c} className="rounded bg-muted px-2 py-0.5">
                      {c}
                    </span>
                  ))
                : null}
              {p.date && !Number.isNaN(Date.parse(p.date)) ? (
                <time dateTime={p.date} className="ms-auto opacity-80">
                  {fmt.format(new Date(p.date))}
                </time>
              ) : null}
            </Inline>
          ) : null}
          {p.excerpt && (
            // i18n-exempt -- DS-1234 [ttl=2025-11-30] — excerpt is CMS-provided content, not hardcoded
            <p className="text-muted" data-token="--color-muted">
              {p.excerpt}
            </p>
          )}
          {p.shopUrl && (
            <p>
              <Link href={p.shopUrl} className="text-primary underline">
                {shopStoryCta}
              </Link>
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
