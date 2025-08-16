// src/components/blog/BlogPortableText.tsx
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import { getProductBySlug, getProductById } from "@/lib/products";
import { ProductCard } from "../shop/ProductCard";

const components = {
  types: {
    productReference: ({ value }: any) => {
      const ids: string[] = Array.isArray(value?.ids)
        ? value.ids
        : Array.isArray(value?.slugs)
          ? value.slugs
          : typeof value?.id === "string"
            ? [value.id]
            : typeof value?.slug === "string"
              ? [value.slug]
              : [];
      const products = ids
        .map((id) => getProductById(id) ?? getProductBySlug(id))
        .filter(Boolean);
      if (products.length === 0) return null;
      if (products.length === 1) {
        const p = products[0]!;
        return (
          <Link href={`../product/${p.slug}`} className="underline">
            {p.title}
          </Link>
        );
      }
      return (
        <div className="flex gap-4 overflow-x-auto py-4">
          {products.map((p) => (
            <ProductCard key={p.id} sku={p} />
          ))}
        </div>
      );
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

export function BlogPortableText({ value }: { value: any[] }) {
  return <PortableText value={value} components={components} />;
}
