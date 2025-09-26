"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Button } from "@ui/components/atoms/shadcn";
import { Chip } from "@ui/components/atoms";

interface HeroProps {
  shop: string;
  productId: string;
  status: string;
  sku: string;
  publishTarget: string;
  formId: string;
}

export default function ProductEditHero({
  shop,
  productId,
  status,
  sku,
  publishTarget,
  formId,
}: HeroProps) {
  const handleDiscard = useCallback(() => {
    window.history.back();
  }, []);

  const summary = [
    { label: "Status", value: status },
    { label: "SKU", value: sku },
    { label: "Publish target", value: publishTarget },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <h1 className="text-2xl font-semibold">
            Edit product &ndash; {shop}/{productId}
          </h1>
          <div className="flex flex-wrap gap-2">
            {summary.map(({ label, value }) => (
              <Chip
                key={label}
                className="bg-muted px-3 py-1 text-xs uppercase tracking-wide"
              >
                <span className="text-[0.65rem] font-medium text-muted-foreground">
                  {label}
                </span>
                <span className="ms-1 font-semibold text-foreground">{value}</span>
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
          >
            Discard changes
          </Button>
          <Button type="submit" form={formId}>
            Save changes
          </Button>
        </div>
      </div>
      <div>
        <Button
          asChild
          variant="ghost"
          className="px-0 text-sm text-muted-foreground hover:text-foreground"
        >
          <Link href={`/shop/${shop}/products/${productId}`}>View product</Link>
        </Button>
      </div>
    </section>
  );
}
