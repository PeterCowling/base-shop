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
  return <BlogListing posts={items} />;
}
