"use client";

import Link from "next/link";

import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";
import { Inline } from "@acme/design-system/primitives/Inline";

import { useXaCatalogSnapshot } from "../lib/liveCatalog";
import { siteConfig } from "../lib/siteConfig";
import {
  filterByDepartment,
  formatLabel,
  getNewInProducts,
  getTrendingDesigners,
  isProductImage,
  XA_ALLOWED_CATEGORIES,
  XA_CATEGORY_LABELS,
  XA_DEPARTMENT_LABELS,
  XA_SUBCATEGORIES,
} from "../lib/xaCatalog";
import { xaI18n } from "../lib/xaI18n";
import { getDesignerHref } from "../lib/xaRoutes";
import type { XaDepartment } from "../lib/xaTypes";

import { XaFadeImage } from "./XaFadeImage";
import { XaProductCard } from "./XaProductCard";

export function XaDepartmentLanding({ department }: { department: XaDepartment }) {
  const { brands, products: liveProducts } = useXaCatalogSnapshot();
  const departmentLabel = XA_DEPARTMENT_LABELS[department];
  const products = filterByDepartment(liveProducts, department);
  const newIn = getNewInProducts(products, 4);
  const trendingDesigners = getTrendingDesigners(4, department, { brands, products: liveProducts });

  const categoryCards = XA_ALLOWED_CATEGORIES.map((category) => {
    const catProducts = products.filter((p) => p.taxonomy.category === category);
    let withImage: (typeof catProducts)[0] | undefined;
    let image: (typeof catProducts)[0]["media"][0] | undefined;
    for (const p of catProducts) {
      const found = p.media.find(isProductImage);
      if (found) { withImage = p; image = found; break; }
    }
    return {
      label: XA_CATEGORY_LABELS[category],
      href: `/${department}/${category}`,
      items: XA_SUBCATEGORIES[category],
      imageUrl: image?.url,
      imageAlt: image?.altText ?? withImage?.title ?? XA_CATEGORY_LABELS[category],
    };
  });

  return (
    <main className="sf-content">
      <Section padding="wide">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{departmentLabel}</h1>
          <p className="text-muted-foreground">
            New in {siteConfig.catalog.labelPlural}{xaI18n.t("xaB.src.components.xadepartmentlanding.l41c52")}</p>
        </div>
      </Section>

      <Section padding="default">
        <Inline gap={2} alignY="center" className="justify-between">
          <h2 className="text-xl font-semibold">New In</h2>
          <Link href={`/new-in?department=${department}`} className="text-sm underline">
            View all
          </Link>
        </Inline>
        <div className="mt-6">
          <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
            {newIn.map((product) => (
              <XaProductCard key={product.slug} product={product} />
            ))}
          </Grid>
        </div>
      </Section>

      <Section padding="default">
        <h2 className="text-xl font-semibold">{xaI18n.t("xaB.src.components.xadepartmentlanding.l63c47")}</h2>
        <Inline gap={3} className="mt-4 flex-wrap">
          {trendingDesigners.map((designer) => (
              <Link
                key={designer.handle}
                href={getDesignerHref(designer.handle)}
                className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {designer.name}
            </Link>
          ))}
        </Inline>
      </Section>

      <Section padding="default">
        <h2 className="text-xl font-semibold">{xaI18n.t("xaB.src.components.xadepartmentlanding.l78c47")}</h2>
        <Grid columns={{ base: 1, md: 3 }} gap={6} className="mt-6">
          {categoryCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="xa-panel group overflow-hidden rounded-sm border border-border-1"
            >
              {/* eslint-disable-next-line ds/no-arbitrary-tailwind -- XA-0022: category card aspect ratio */}
              <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                {card.imageUrl ? (
                  <XaFadeImage
                    src={card.imageUrl}
                    alt={card.imageAlt}
                    fill
                    // eslint-disable-next-line ds/no-hardcoded-copy -- XA-0022: image sizes hint
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div
                    // eslint-disable-next-line ds/enforce-layout-primitives -- XA-0022: category card fallback leaf
                    className="flex h-full w-full items-center justify-center text-sm text-muted-foreground"
                  >
                    {card.label}
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold uppercase tracking-wide">{card.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {card.items.map(formatLabel).join(" / ")}
                </div>
              </div>
            </Link>
          ))}
        </Grid>
      </Section>
    </main>
  );
}
