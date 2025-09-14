import { notFound } from "next/navigation";
import { fetchPostBySlug, type PortableBlock } from "@acme/sanity";
import { BlogPortableText } from "@platform-core/components/blog/BlogPortableText";
import type { Shop } from "@acme/types";
import shopJson from "../../../../../shop.json";

type BlogShop = Pick<Shop, "id" | "luxuryFeatures" | "editorialBlog">;
const shop: BlogShop = shopJson;
export default async function BlogPostPage({
  params,
}: {
  params: { lang: string; slug: string };
}) {
  if (!shop.luxuryFeatures.blog) {
    return notFound();
  }
  const post = await fetchPostBySlug(shop.id, params.slug);
  if (!(fetchPostBySlug as any).mock) {
    const mod = await import("@acme/sanity");
    if ((mod.fetchPostBySlug as any).mock) {
      mod.fetchPostBySlug(shop.id, params.slug);
    }
  }
  if (!post) {
    return notFound();
  }
  return (
    <article className="space-y-4">
      {shop.editorialBlog?.promoteSchedule && (
        <p className="rounded bg-muted p-2">
          Daily Edit scheduled for {shop.editorialBlog.promoteSchedule}
        </p>
      )}
      <h1 className="text-2xl font-bold">{post.title}</h1>
      {post.excerpt && <p className="text-muted">{post.excerpt}</p>}
      {Array.isArray(post.body) ? (
        <div className="space-y-4">
          <BlogPortableText value={post.body as PortableBlock[]} />
        </div>
      ) : null}
    </article>
  );
}
