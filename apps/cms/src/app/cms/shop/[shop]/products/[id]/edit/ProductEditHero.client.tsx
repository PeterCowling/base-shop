"use client";

import { useCallback } from "react";
import Link from "next/link";

import { useTranslations } from "@acme/i18n";
import { Chip } from "@acme/ui/components/atoms";
import { Inline } from "@acme/ui/components/atoms/primitives";
import { Button } from "@acme/ui/components/atoms/shadcn";

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
  const t = useTranslations();
  const handleDiscard = useCallback(() => {
    window.history.back();
  }, []);

  const summary = [
    { label: String(t("Status")), value: status },
    { label: String(t("SKU")), value: sku },
    { label: String(t("Publish target")), value: publishTarget },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <h1 className="text-2xl font-semibold">
            {t("Edit product")} &ndash; {shop}/{productId}
          </h1>
          <Inline gap={2} className="">
            {summary.map(({ label, value }) => (
              <Chip
                key={label}
                className="bg-muted px-3 py-1 text-xs uppercase tracking-wide"
              >
                <span className="text-xs font-medium text-muted-foreground">{t(label)}</span>
                <span className="ms-1 font-semibold text-foreground">{value}</span>
              </Chip>
            ))}
          </Inline>
        </div>
        <Inline className="shrink-0" gap={2}>
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
          >
            {t("Discard changes")}
          </Button>
          <Button type="submit" form={formId}>
            {t("Save changes")}
          </Button>
        </Inline>
      </div>
      <div>
        <Button
          asChild
          variant="ghost"
          className="px-0 text-sm text-muted-foreground hover:text-foreground"
        >
          <Link href={`/shop/${shop}/products/${productId}`}>{t("View product")}</Link>
        </Button>
      </div>
    </section>
  );
}
