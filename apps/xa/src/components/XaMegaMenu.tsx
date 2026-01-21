"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] XA mega menu uses legacy patterns pending design/i18n overhaul */

import Link from "next/link";

import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/components/atoms";
import { Stack } from "@acme/ui/components/atoms/primitives/Stack";

import { XaFadeImage } from "./XaFadeImage";
import { XA_PRODUCTS } from "../lib/demoData";
import {
  XA_ALLOWED_CATEGORIES,
  XA_CATEGORY_LABELS,
  formatLabel,
  getDesignerName,
  getTrendingDesigners,
  XA_SUBCATEGORIES,
} from "../lib/xaCatalog";
import type { XaDepartment } from "../lib/xaTypes";
import { siteConfig } from "../lib/siteConfig";

export function XaMegaMenu({
  label,
  department,
}: {
  label: string;
  department: XaDepartment;
}) {
  const trendingDesigners = getTrendingDesigners(4, department);
  const base = `/${department}`;
  const primaryCategory = siteConfig.catalog.category;
  const categorySections = XA_ALLOWED_CATEGORIES.map((category) => ({
    category,
    label: XA_CATEGORY_LABELS[category],
    href: `${base}/${category}`,
    items: XA_SUBCATEGORIES[category],
  }));
  const featuredProduct = XA_PRODUCTS.find(
    (product) => product.taxonomy.department === department,
  );
  const featuredMedia = featuredProduct?.media?.[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center text-sm font-medium hover:underline"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={0}
        className="w-screen max-w-none rounded-none border-0 bg-white px-0 pb-10 pt-8 shadow-none"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="mx-auto flex w-full max-w-screen-2xl gap-10 px-6">
          <div className="grid flex-1 gap-6 md:grid-cols-5">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                New In
              </div>
              <Stack gap={2}>
                <Link href={`/new-in?department=${department}&window=day`} className="text-sm hover:underline">
                  Today
                </Link>
                <Link href={`/new-in?department=${department}&window=week`} className="text-sm hover:underline">
                  This week
                </Link>
                <Link href={`${base}/${primaryCategory}?sort=best-sellers`} className="text-sm hover:underline">
                  Best sellers
                </Link>
              </Stack>
            </div>
            {categorySections.map((section) => (
              <div key={`${department}-${section.category}`} className="space-y-3">
                <Link
                  href={section.href}
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  {section.label}
                </Link>
                <Stack gap={2}>
                  {section.items.map((item) => (
                    <Link
                      key={`${department}-${section.category}-${item}`}
                      href={`${section.href}/${item}`}
                      className="text-sm hover:underline"
                    >
                      {formatLabel(item)}
                    </Link>
                  ))}
                </Stack>
              </div>
            ))}
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Brands
              </div>
              <Stack gap={2}>
                {trendingDesigners.map((designer) => (
                  <Link
                    key={`${department}-designer-${designer.handle}`}
                    href={`/designer/${designer.handle}`}
                    className="text-sm hover:underline"
                  >
                    {designer.name}
                  </Link>
                ))}
                <Link href="/designers" className="text-sm font-semibold hover:underline">
                  All brands A-Z
                </Link>
              </Stack>
            </div>
          </div>
          {featuredProduct && featuredMedia ? (
            <Link
              href={`/products/${featuredProduct.slug}`}
              className="hidden w-52 shrink-0 lg:block"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-white">
                <XaFadeImage
                  src={featuredMedia.url}
                  alt={featuredMedia.altText ?? featuredProduct.title}
                  width={320}
                  height={420}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {getDesignerName(featuredProduct.brand)}
              </div>
              <div className="mt-1 text-sm">{featuredProduct.title}</div>
            </Link>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
