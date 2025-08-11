import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import { fetchPostBySlug } from "@acme/sanity";
import { getProductBySlug } from "@/lib/products";
import { ProductCard } from "@/components/shop/ProductCard";
import shop from "../../../../../shop.json";

const components = {
  types: {
    productReference: ({ value }: any) => {
      if (typeof value?.slug !== "string") return null;
      const sku = getProductBySlug(value.slug);
      return sku ? <ProductCard sku={sku} /> : null;
    },
    embed: ({ value }: any) => (
      <div className="aspect-video">
        <iframe src={value.url} className="h-full w-full" />
      </div>
    ),
  },
  marks: {
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        className="text-blue-600 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    em: ({ children }: any) => <em>{children}</em>,
  },
  block: {
    h1: ({ children }: any) => <h1>{children}</h1>,
    h2: ({ children }: any) => <h2>{children}</h2>,
    h3: ({ children }: any) => <h3>{children}</h3>,
  },
};

export default async function BlogPostPage({
  params,
}: {
  params: { lang: string; slug: string };
}) {
  const post = await fetchPostBySlug(shop.id, params.slug);
  if (!post) notFound();
  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-bold">{post.title}</h1>
      {post.excerpt && <p className="text-muted">{post.excerpt}</p>}
      {Array.isArray(post.body) ? (
        <div className="space-y-4">
          <PortableText value={post.body} components={components} />
        </div>
      ) : null}
    </article>
  );
}
