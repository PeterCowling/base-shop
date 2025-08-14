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
  const editorial = (shop as any).editorialBlog as
    | { enabled: boolean; promoteSchedule?: string }
    | undefined;
  return (
    <>
      {editorial?.enabled && editorial.promoteSchedule ? (
        <div className="mb-4 rounded bg-yellow-100 p-4 text-yellow-900">
          Daily Edit scheduled for {" "}
          {new Date(editorial.promoteSchedule).toLocaleDateString()}
        </div>
      ) : null}
      <BlogListing posts={items} />
    </>
  );
}
