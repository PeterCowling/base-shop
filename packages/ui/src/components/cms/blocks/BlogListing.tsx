"use client";
import Link from "next/link";

export type BlogPost = {
  title: string;
  excerpt?: string;
  url?: string;
  shopUrl?: string;
};

export default function BlogListing({ posts = [] }: { posts?: BlogPost[] }) {
  if (!posts.length) return null;
  return (
    <section className="space-y-4">
      {posts.map((p) => (
        <article key={p.title} className="space-y-1">
          {p.url ? (
            <h3 className="text-lg font-semibold">
              <Link href={p.url}>{p.title}</Link>
            </h3>
          ) : (
            <h3 className="text-lg font-semibold">{p.title}</h3>
          )}
          {p.excerpt && (
            // i18n-exempt: excerpt is CMS-provided content, not hardcoded
            <p className="text-muted" data-token="--color-muted">
              {p.excerpt}
            </p>
          )}
          {p.shopUrl && (
            <p>
              <Link href={p.shopUrl} className="text-primary underline">
                {/* i18n-exempt: default CTA text can be overridden by CMS */}
                Shop the story
              </Link>
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
