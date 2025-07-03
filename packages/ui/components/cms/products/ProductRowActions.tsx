"use client";

import { Button } from "@/components/atoms-shadcn";
import { ProductPublication } from "@platform-core/products";
import Link from "next/link";

interface Props {
  shop: string;
  product: ProductPublication;
  onDuplicate(id: string): void;
  onDelete(id: string): void;
}

export default function ProductRowActions({
  shop,
  product,
  onDuplicate,
  onDelete,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/cms/shop/${shop}/products/${product.id}/edit`}
        className="bg-primary hover:bg-primary/90 rounded px-2 py-1 text-xs text-white"
      >
        Edit
      </Link>
      <Link
        href={`/en/product/${product.id}`}
        className="rounded border px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        View
      </Link>
      <Button
        onClick={() => onDuplicate(product.id)}
        variant="outline"
        className="px-2 py-1 text-xs"
      >
        Duplicate
      </Button>
      <Button
        onClick={() => onDelete(product.id)}
        variant="outline"
        className="px-2 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-900"
      >
        Delete
      </Button>
    </div>
  );
}
