import Link from "next/link";

import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";
import { Inline } from "@acme/design-system/primitives/Inline";

import { XA_PRODUCTS } from "../lib/demoData";
import { siteConfig } from "../lib/siteConfig";
import {
  filterByDepartment,
  formatLabel,
  getTrendingDesigners,
  XA_ALLOWED_CATEGORIES,
  XA_CATEGORY_LABELS,
  XA_SUBCATEGORIES,
} from "../lib/xaCatalog";
import { xaI18n } from "../lib/xaI18n";
import type { XaDepartment } from "../lib/xaTypes";

import { XaProductCard } from "./XaProductCard";

export function XaDepartmentLanding({ department }: { department: XaDepartment }) {
  const departmentLabel = formatLabel(department);
  const products = filterByDepartment(XA_PRODUCTS, department);
  const newIn = [...products]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const trendingDesigners = getTrendingDesigners(4, department);

  const categoryCards = XA_ALLOWED_CATEGORIES.map((category) => ({
    label: XA_CATEGORY_LABELS[category],
    href: `/${department}/${category}`,
    items: XA_SUBCATEGORIES[category],
  }));

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
              href={`/designer/${designer.handle}`}
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
              className="rounded-lg border p-5 hover:shadow-sm"
            >
              <div className="text-lg font-semibold">{card.label}</div>
              <div className="mt-3 text-sm text-muted-foreground">
                {card.items.map(formatLabel).join(" / ")}
              </div>
            </Link>
          ))}
        </Grid>
      </Section>
    </main>
  );
}
