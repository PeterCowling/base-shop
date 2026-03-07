"use client";

import Link from "next/link";

import { Grid } from "@acme/design-system/atoms/Grid";
import { Section } from "@acme/design-system/atoms/Section";

import { useXaCatalogSnapshot } from "../../lib/liveCatalog";
import { xaI18n } from "../../lib/xaI18n";
import { getCollectionHref } from "../../lib/xaRoutes";

export default function CollectionsIndexPage() {
  const { collections } = useXaCatalogSnapshot();
  return (
    <main className="sf-content">
      <Section padding="wide">
        <h1 className="text-2xl font-semibold">Collections</h1>
        <p className="text-muted-foreground">{xaI18n.t("xaB.src.app.collections.page.l13c46")}</p>
      </Section>

      <Section padding="default">
        <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
          <Link
            href={getCollectionHref("all")}
            className="rounded-lg border p-4 hover:shadow-sm"
          >
            <div className="font-medium">All products</div>
            <div className="text-sm text-muted-foreground">{xaI18n.t("xaB.src.app.collections.page.l25c60")}</div>
          </Link>
          {collections.map((c) => (
            <Link
              key={c.handle}
              href={getCollectionHref(c.handle)}
              className="rounded-lg border p-4 hover:shadow-sm"
            >
              <div className="font-medium">{c.title}</div>
              {c.description ? (
                <div className="text-sm text-muted-foreground">
                  {c.description}
                </div>
              ) : null}
            </Link>
          ))}
        </Grid>
      </Section>
    </main>
  );
}
