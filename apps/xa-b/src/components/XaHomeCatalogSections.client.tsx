"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";

import { useXaCatalogSnapshot } from "../lib/liveCatalog";
import { siteConfig } from "../lib/siteConfig";
import { getNewInProducts } from "../lib/xaCatalog";
import { xaI18n } from "../lib/xaI18n";

import { XaProductCard } from "./XaProductCard";

export function XaHomeCatalogSections() {
  const { products } = useXaCatalogSnapshot();
  const catalog = siteConfig.catalog;
  const newInProducts = React.useMemo(
    () => getNewInProducts(products, 12),
    [products],
  );

  return (
    <Section padding="default">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">
          New in:{" "}
          <span className="font-normal text-muted-foreground">{xaI18n.t("xaB.src.app.page.l83c65")}{catalog.labelPlural}{xaI18n.t("xaB.src.app.page.l84c53")}</span>
        </h2>
        <Button variant="outline" asChild>
          <Link href="/new-in">Shop now</Link>
        </Button>
      </div>

      <div className="mt-6">
        <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
          {newInProducts.map((p) => (
            <XaProductCard key={p.slug} product={p} />
          ))}
        </Grid>
      </div>
    </Section>
  );
}
