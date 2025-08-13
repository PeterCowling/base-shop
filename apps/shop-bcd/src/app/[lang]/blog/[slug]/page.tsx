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
  const dailyEdit =
    shop.editorialBlog?.enabled && shop.editorialBlog.promoteSchedule;
  return (
    <article className="space-y-4">
      {dailyEdit && (
        <p className="text-sm text-muted">
          Daily Edit scheduled for {shop.editorialBlog!.promoteSchedule}
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
