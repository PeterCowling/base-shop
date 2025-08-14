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
      <article className="space-y-4">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        {post.excerpt && <p className="text-muted">{post.excerpt}</p>}
        {Array.isArray(post.body) ? (
          <div className="space-y-4">
            <BlogPortableText value={post.body} />
          </div>
        ) : null}
      </article>
    </>
  );
}
