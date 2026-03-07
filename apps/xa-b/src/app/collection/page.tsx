"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";

import { XaProductListing } from "../../components/XaProductListing.client";
import { findXaCollection, useXaCatalogSnapshot } from "../../lib/liveCatalog";
import { formatLabel } from "../../lib/xaCatalog";
import { xaI18n } from "../../lib/xaI18n";

export default function CollectionRuntimePage() {
  const searchParams = useSearchParams();
  const { collections, products } = useXaCatalogSnapshot();
  const handle = searchParams.get("handle")?.trim() ?? "";

  if (!handle) {
    return (
      <main className="sf-content">
        <Section padding="default">
          <EmptyState
            className="rounded-sm border border-border-1"
            title={xaI18n.t("xaB.src.app.collection.page.emptyTitle")}
            description={xaI18n.t("xaB.src.app.collection.page.emptyDescription")}
          />
        </Section>
      </main>
    );
  }

  if (handle === "all") {
    return (
      <Suspense fallback={null}>
        <XaProductListing
          title="# ALL Products"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "ALL Products" },
          ]}
          products={products}
        />
      </Suspense>
    );
  }

  const collection = findXaCollection(collections, handle);
  const collectionProducts = products.filter((product) => product.collection === handle);

  return (
    <Suspense fallback={null}>
      <XaProductListing
        title={`# ${collection?.title ?? formatLabel(handle)}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          { label: collection?.title ?? formatLabel(handle) },
        ]}
        products={collectionProducts}
      />
    </Suspense>
  );
}
