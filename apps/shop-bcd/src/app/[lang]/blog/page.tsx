import BlogListing from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import Link from "next/link";
import shop from "../../../../shop.json";

export default async function BlogPage({ params }: { params: { lang: string } }) {
  const posts = await fetchPublishedPosts(shop.id);
  const items = posts.map((p) => ({
    title: p.title,
    excerpt: p.excerpt,
    url: `/${params.lang}/blog/${p.slug}`,
  }));
  const daily =
    shop.editorialBlog?.enabled && shop.editorialBlog.promoteSchedule
      ? items[0]
      : null;
  return (
    <>
      {daily && (
        <section className="space-y-1 border p-4" data-testid="daily-edit">
          <h2 className="font-semibold">Daily Edit</h2>
          {daily.url ? (
            <h3 className="text-lg font-semibold">
              <Link href={daily.url}>{daily.title}</Link>
            </h3>
          ) : (
            <h3 className="text-lg font-semibold">{daily.title}</h3>
          )}
          {daily.excerpt && <p className="text-muted">{daily.excerpt}</p>}
        </section>
      )}
      <BlogListing posts={items} />
    </>
  );
}
