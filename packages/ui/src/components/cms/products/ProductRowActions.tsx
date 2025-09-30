"use client";

import { Button } from "../../atoms/shadcn";
import type { ProductPublication } from "@acme/types";
import Link from "next/link";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  const tf = (key: string, fallback: string) => {
    const val = t(key) as string;
    return val === key ? fallback : val;
  };
  // i18n-exempt: DS token reference, not user-facing copy
  const DANGER_TOKEN = "--color-danger";
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/cms/shop/${shop}/products/${product.id}/edit`}
        className="bg-primary hover:bg-primary/90 rounded px-2 py-1 text-xs text-primary-fg inline-flex items-center justify-center min-h-10 min-w-10"
      >
        {tf("cms.products.actions.edit", "Edit") as string}
      </Link>
      <Link
        href={`/en/product/${product.id}`}
        className="rounded border px-2 py-1 text-xs hover:bg-muted inline-flex items-center justify-center min-h-10 min-w-10"
      >
        {tf("cms.products.actions.view", "View") as string}
      </Link>
      <Button
        onClick={() => onDuplicate(product.id)}
        variant="outline"
        className="px-2 py-1 text-xs min-h-10 min-w-10"
      >
        {tf("cms.products.actions.duplicate", "Duplicate") as string}
      </Button>
      <Button
        onClick={() => onDelete(product.id)}
        variant="outline"
        className="px-2 py-1 text-xs min-h-10 min-w-10 hover:bg-danger hover:text-danger-foreground"
        data-token={DANGER_TOKEN}
      >
        {tf("cms.products.actions.delete", "Delete") as string}
      </Button>
    </div>
  );
}
