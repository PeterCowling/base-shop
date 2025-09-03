"use client";

import { useEffect, useState } from "react";
import type { SKU } from "@acme/types";
import { formatCurrency } from "@acme/shared-utils";
import Image from "next/image";

export interface Props {
  slug: string;
  onValidChange?: (valid: boolean) => void;
}

export default function ProductPreview({ slug, onValidChange }: Props) {
  const [product, setProduct] = useState<SKU | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setProduct(null);
    onValidChange?.(false);

    (async () => {
      try {
        const url = new URL(
          `/api/products?slug=${encodeURIComponent(slug)}`,
          globalThis.location?.origin ?? "http://localhost"
        );

        const res = await fetch(url.toString(), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load product");
        const data = (await res.json()) as SKU;
        setProduct(data);
        setError(null);
        onValidChange?.(true);
      } catch {
        if (!controller.signal.aborted) {
          setError("Failed to load product");
          onValidChange?.(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
      onValidChange?.(false);
    };
  }, [slug, onValidChange]);

  if (loading) return <div className="border p-2">Loading…</div>;
  if (error || !product)
    return (
      <div className="border p-2 text-red-500">{error ?? "Not found"}</div>
    );
  const available = (product.stock ?? 0) > 0;
  const imageUrl = product.media?.[0]?.url ?? "/file.svg";
  return (
    <div className="flex gap-2 border p-2">
      <Image
        src={imageUrl}
        alt={product.title}
        width={64}
        height={64}
        className="h-16 w-16 object-cover"
      />
      <div className="space-y-1">
        <div className="font-semibold">{product.title}</div>
        <div>{formatCurrency(product.price)}</div>
        <div className="text-sm">{available ? "In stock" : "Out of stock"}</div>
      </div>
    </div>
  );
}
