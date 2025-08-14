import { notFound } from "next/navigation";
import { fetchPostBySlug } from "@acme/sanity";
import { BlogPortableText } from "@/components/blog/BlogPortableText";
import shop from "../../../../../shop.json";

export default async function BlogPostPage({
  params,
}: {
  params: { lang: string; slug: string };
}) {
  const post = await fetchPostBySlug(shop.id, params.slug);
  if (!post) notFound();
  const editorial = (shop as any).editorialBlog as
    | { enabled: boolean; promoteSchedule?: string }
    | undefined;
  const isDailyEdit = editorial?.enabled && params.slug === "daily-edit";
  return (
    <article className="space-y-4">
      {isDailyEdit && (
        <p className="rounded bg-yellow-100 px-2 py-1 text-sm font-semibold text-yellow-900">
          Daily Edit
        </p>
      )}
      <h1 className="text-2xl font-bold">{post.title}</h1>
      {post.excerpt && <p className="text-muted">{post.excerpt}</p>}
      {Array.isArray(post.body) ? (
        <div className="space-y-4">
          <BlogPortableText value={post.body} />
        </div>
      ) : null}
    </article>
  );
}
