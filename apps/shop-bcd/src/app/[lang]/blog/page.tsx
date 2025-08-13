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
  const dailyEdit =
    shop.editorialBlog?.enabled && shop.editorialBlog.promoteSchedule;
  return (
    <>
      {dailyEdit && (
        <div className="mb-4 rounded bg-yellow-100 p-2 text-center text-sm">
          Daily Edit scheduled for {shop.editorialBlog!.promoteSchedule}
        </div>
      )}
      <BlogListing posts={items} />
    </>
  );
}
