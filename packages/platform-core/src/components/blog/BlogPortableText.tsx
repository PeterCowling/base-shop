// src/components/blog/BlogPortableText.tsx
import { PortableText } from "@portabletext/react";
import type {
  PortableTextComponents,
  PortableTextMarkComponentProps,
  PortableTextTypeComponentProps,
  PortableTextComponentProps,
} from "@portabletext/react";
import Link from "next/link";
import { getProductBySlug, getProductById, type SKU } from "../../products";
import { ProductCard } from "../shop/ProductCard";

const components: PortableTextComponents = {
  types: {
    productReference: ({
      value,
    }: PortableTextTypeComponentProps<{
      ids?: string[];
      slugs?: string[];
      id?: string;
      slug?: string;
    }>) => {
      const ids: string[] = Array.isArray(value?.ids)
        ? value.ids
        : Array.isArray(value?.slugs)
          ? value.slugs
          : typeof value?.id === "string"
            ? [value.id]
            : typeof value?.slug === "string"
              ? [value.slug]
              : [];

      const products: SKU[] = ids
        .map((id) => getProductById(id) ?? getProductBySlug(id))
        .filter((p): p is SKU => Boolean(p));

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
        // eslint-disable-next-line ds/enforce-layout-primitives -- ABC-123 horizontal scroller with mapped items
        <div className="inline-flex gap-4 overflow-x-auto py-4">
          {products.map((p) => (
            <ProductCard key={p.id} sku={p} />
          ))}
        </div>
      );
    },
    embed: ({ value }: PortableTextTypeComponentProps<{ url: string }>) => (
      <div className="aspect-video">
        <iframe src={value.url} className="h-full w-full" />
      </div>
    ),
  },
  marks: {
    link: ({ children, value }: PortableTextMarkComponentProps) => {
      const href = (value as { href?: string })?.href ?? "";
      return (
        <a
          href={href}
          className="text-blue-600 underline inline-block min-h-11 min-w-11"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
    em: ({ children }: PortableTextMarkComponentProps) => <em>{children}</em>,
  },
  block: {
    h1: ({ children }: PortableTextComponentProps<unknown>) => <h1>{children}</h1>,
    h2: ({ children }: PortableTextComponentProps<unknown>) => <h2>{children}</h2>,
    h3: ({ children }: PortableTextComponentProps<unknown>) => <h3>{children}</h3>,
  },
};

type PortableBlock = { _type: string; [key: string]: unknown };

export function BlogPortableText({ value }: { value: PortableBlock[] }) {
  return <PortableText value={value} components={components} />;
}
