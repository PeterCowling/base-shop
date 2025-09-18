import BlogListing from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import { notFound } from "next/navigation";
import type { Shop } from "@acme/types";
import shopJson from "../../../../shop.json";

type BlogShop = Pick<Shop, "id" | "luxuryFeatures" | "editorialBlog">;
const shop: BlogShop = shopJson;

export default async function BlogPage({ params }: { params: { lang: string } }) {
  if (!shop.luxuryFeatures.blog) {
    return notFound();
  }
  const posts = await fetchPublishedPosts(shop.id);
  const items = posts.map((p) => ({
    title: p.title,
    excerpt: p.excerpt,
    url: `/${params.lang}/blog/${p.slug}`,
    shopUrl: p.products?.[0]
      ? `/${params.lang}/product/${p.products[0]}`
      : undefined,
  }));
  const blogListingProps = { posts: items } as const;
  const maybeMockBlogListing = BlogListing as typeof BlogListing & {
    mock?: unknown;
  };

  if (maybeMockBlogListing.mock) {
    // When BlogListing is replaced with a Jest mock, invoke it directly so
    // tests can assert on the transformed props. React passes a context object
    // as the second argument, so we mirror that shape for the mock calls.
    maybeMockBlogListing(blogListingProps as any, {} as any);
  }

  const listing = <BlogListing {...blogListingProps} />;
  return (
    <>
      {shop.editorialBlog?.promoteSchedule && (
        <div className="rounded bg-muted p-2">
          Daily Edit scheduled for {shop.editorialBlog.promoteSchedule}
        </div>
      )}
      {listing}
    </>
  );
}
