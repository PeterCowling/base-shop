"use client";
import Link from "next/link";

export type BlogPost = { title: string; excerpt?: string; url?: string };

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
          {p.excerpt && <p className="text-gray-600">{p.excerpt}</p>}
        </article>
      ))}
    </section>
  );
}
