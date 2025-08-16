import { useEffect, useState } from "react";
import type { SKU } from "@acme/types";
import { formatCurrency } from "@acme/shared-utils";

export interface Props {
  sku: string;
  onValidChange?: (valid: boolean) => void;
}

export default function ProductPreview({ sku, onValidChange }: Props) {
  const [product, setProduct] = useState<SKU | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products?sku=${encodeURIComponent(sku)}`
        );
        if (!res.ok) throw new Error("Failed to load product");
        const data: SKU = await res.json();
        if (active) {
          setProduct(data);
          setError(null);
          onValidChange?.(true);
        }
      } catch {
        if (active) {
          setError("Failed to load product");
          onValidChange?.(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
      onValidChange?.(true);
    };
  }, [sku, onValidChange]);

  if (loading) return <div className="border p-2">Loading…</div>;
  if (error || !product)
    return (
      <div className="border p-2 text-red-500">{error ?? "Not found"}</div>
    );
  const available = (product.stock ?? 0) > 0;
  return (
    <div className="flex gap-2 border p-2">
      {product.media?.[0] && (
        <img
          src={product.media[0].url}
          alt={product.title}
          className="h-16 w-16 object-cover"
        />
      )}
      <div className="space-y-1">
        <div className="font-semibold">{product.title}</div>
        <div>{formatCurrency(product.price)}</div>
        <div className="text-sm">{available ? "In stock" : "Out of stock"}</div>
      </div>
    </div>
  );
}
