import { notFound } from "next/navigation";
import { fetchPostBySlug } from "@lib/sanity.server";
import { getProductBySlug } from "@/lib/products";
import { ProductCard } from "@/components/shop/ProductCard";
import shop from "../../../../../shop.json";

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
          {post.body.map((b: any, i: number) => {
            if (b._type === "productReference" && typeof b.slug === "string") {
              const sku = getProductBySlug(b.slug);
              return sku ? <ProductCard key={i} sku={sku} /> : null;
            }
            return (
              <p key={i}>{b.children?.map((c: any) => c.text).join("")}</p>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
