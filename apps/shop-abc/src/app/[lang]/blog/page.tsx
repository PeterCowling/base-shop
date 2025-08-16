import BlogListing from "@ui/components/cms/blocks/BlogListing";
import { getPublishedPosts } from "@acme/blog";
import { notFound } from "next/navigation";
import shop from "../../../../shop.json";

export default async function BlogPage({ params }: { params: { lang: string } }) {
  if (!shop.editorialBlog?.enabled || !shop.luxuryFeatures.blog) {
    notFound();
  }
  const posts = getPublishedPosts();
  const items = posts.map((p) => ({
    title: p.title,
    excerpt: p.excerpt,
    url: `/${params.lang}/blog/${p.slug}`,
    shopUrl: p.skus?.[0]
      ? `/${params.lang}/product/${p.skus[0]}`
      : undefined,
  }));
  return (
    <>
      {shop.editorialBlog?.promoteSchedule && (
        <div className="rounded bg-muted p-2">
          Daily Edit scheduled for {shop.editorialBlog.promoteSchedule}
        </div>
      )}
      <BlogListing posts={items} />
    </>
  );
}
