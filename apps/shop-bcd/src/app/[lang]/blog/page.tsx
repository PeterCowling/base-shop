import BlogListing from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import { notFound } from "next/navigation";
import shop from "../../../../shop.json";

export default async function BlogPage({ params }: { params: { lang: string } }) {
  if (!shop.editorialBlog?.enabled) {
    notFound();
  }
  const posts = await fetchPublishedPosts(shop.id);
  const items = posts.map((p) => ({
    title: p.title,
    excerpt: p.excerpt,
    url: `/${params.lang}/blog/${p.slug}`,
  }));
  const promo = shop.editorialBlog?.promoteSchedule;
  return (
    <div className="space-y-4">
      {promo && (
        <p className="font-semibold">Daily Edit scheduled for {promo}</p>
      )}
      <BlogListing posts={items} />
    </div>
  );
}
