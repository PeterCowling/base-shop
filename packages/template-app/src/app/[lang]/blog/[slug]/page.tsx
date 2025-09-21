// packages/template-app/src/app/[lang]/blog/[slug]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import { fetchPostBySlug, type PortableBlock } from "@acme/sanity";

export const revalidate = 60;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug } = await params;
  const shop = process.env.NEXT_PUBLIC_SHOP_ID || "default";
  const post = await fetchPostBySlug(shop, slug);
  if (!post) return notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-2 text-muted-foreground">{post.excerpt}</p>
        )}
      </header>
      {post.mainImage && (
        <div className="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-lg">
          <Image src={post.mainImage} alt={post.title} fill className="object-cover" />
        </div>
      )}
      {/* Basic portable text fallback: list paragraphs if provided */}
      <div className="prose prose-slate max-w-none">
        {(post.body as PortableBlock[] | undefined)?.map((block, i) => {
          const children = (block as { children?: unknown }).children;
          if (block?._type === "block" && Array.isArray(children)) {
            const texts = (children as Array<{ text?: unknown }>).map((c) =>
              typeof c.text === "string" ? c.text : "",
            );
            return <p key={i}>{texts.join("")}</p>;
          }
          return null;
        })}
      </div>
    </article>
  );
}
