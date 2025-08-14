// src/components/blog/BlogPortableText.tsx
import { PortableText } from "@portabletext/react";
import { getProductBySlug, getProductById } from "@/lib/products";
import { ProductCard } from "@/components/shop/ProductCard";

const components = {
  types: {
    productReference: ({ value }: any) => {
      let sku;
      if (typeof value?.slug === "string") {
        sku = getProductBySlug(value.slug);
      } else if (typeof value?.id === "string") {
        sku = getProductById(value.id);
      }
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

export function BlogPortableText({ value }: { value: any[] }) {
  return <PortableText value={value} components={components} />;
}
