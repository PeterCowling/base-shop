"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@acme/design-system/atoms";
import { Section } from "@acme/design-system/atoms/Section";

import { XaProductDetail } from "../../components/XaProductDetail";
import { useXaCatalogSnapshot } from "../../lib/liveCatalog";
import { xaI18n } from "../../lib/xaI18n";

function ProductRuntimePageContent() {
  const searchParams = useSearchParams();
  const { products } = useXaCatalogSnapshot();
  const handle = searchParams.get("handle")?.trim() ?? "";
  const product = products.find((item) => item.slug === handle) ?? null;

  if (!handle || !product) {
    return (
      <main className="sf-content">
        <Section padding="default">
          <EmptyState
            className="rounded-sm border border-border-1"
            title={xaI18n.t("xaB.src.app.product.page.emptyTitle")}
            description={xaI18n.t("xaB.src.app.product.page.emptyDescription")}
          />
        </Section>
      </main>
    );
  }

  return <XaProductDetail product={product} products={products} />;
}

export default function ProductRuntimePage() {
  return (
    <Suspense fallback={null}>
      <ProductRuntimePageContent />
    </Suspense>
  );
}
