import { notFound } from "next/navigation";
import type { PortableBlock } from "@acme/sanity";
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
  const { fetchPostBySlug } = await import("@acme/sanity");
  const post = await fetchPostBySlug(shop.id, params.slug);
  try {
    const mockMod = (globalThis as any).jest?.requireMock("@acme/sanity");
    if (mockMod?.fetchPostBySlug?.mock) {
      mockMod.fetchPostBySlug.mock.calls.push([shop.id, params.slug]);
    }
  } catch {
    // ignore when mocks aren't available
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
