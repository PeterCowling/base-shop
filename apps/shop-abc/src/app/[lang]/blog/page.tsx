import BlogListing from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import shop from "../../../../shop.json";

export default async function BlogPage({ params }: { params: { lang: string } }) {
  const posts = await fetchPublishedPosts(shop.id);
  const items = posts.map((p) => ({
    title: p.title,
    excerpt: p.excerpt,
    url: `/${params.lang}/blog/${p.slug}`,
  }));
  const highlight =
    shop.editorialBlog?.enabled && shop.editorialBlog.promoteSchedule
      ? new Date(shop.editorialBlog.promoteSchedule).toLocaleString()
      : null;
  return (
    <>
      {highlight && (
        <div className="mb-4 rounded border p-2">
          Daily Edit scheduled for {highlight}
        </div>
      )}
      <BlogListing posts={items} />
    </>
  );
}
