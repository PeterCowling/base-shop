"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Section } from "@acme/design-system/atoms/Section";
import { Inline } from "@acme/design-system/primitives/Inline";

import { XaProductListing } from "../../../components/XaProductListing.client";
import type { XaProduct } from "../../../lib/demoData";
import { findXaBrand, useXaCatalogSnapshot } from "../../../lib/liveCatalog";
import {
  formatLabel,
  XA_ALLOWED_CATEGORIES,
  XA_ALLOWED_DEPARTMENTS,
  XA_CATEGORY_LABELS,
} from "../../../lib/xaCatalog";
import { getDesignerHref } from "../../../lib/xaRoutes";
import type { XaCategory, XaDepartment } from "../../../lib/xaTypes";

type TabValue = XaDepartment | XaCategory | "new-in";

interface DesignerPageClientProps {
  designerHandle: string;
  designerName?: string;
  designerProducts?: XaProduct[];
}

function DesignerContent({ designerHandle, designerName, designerProducts = [] }: DesignerPageClientProps) {
  const searchParams = useSearchParams();
  const { brands, products: liveProducts } = useXaCatalogSnapshot();
  const designer = findXaBrand(brands, designerHandle) ?? {
    handle: designerHandle,
    name: designerName ?? formatLabel(designerHandle),
  };
  const productsForDesigner = liveProducts.filter((product) => product.brand === designer.handle);
  const catalogProducts = productsForDesigner.length ? productsForDesigner : designerProducts;

  const departmentTabs = XA_ALLOWED_DEPARTMENTS.map((department) => ({
    value: department as TabValue,
    label: formatLabel(department),
  }));
  const categoryTabs = XA_ALLOWED_CATEGORIES.map((category) => ({
    value: category as TabValue,
    label: XA_CATEGORY_LABELS[category],
  }));
  const tabs: Array<{ value: TabValue; label: string }> = [
    ...departmentTabs,
    ...categoryTabs,
    { value: "new-in", label: "New In" },
  ];

  const requestedTab = searchParams.get("tab") ?? "";
  const defaultTab =
    departmentTabs[0]?.value ?? categoryTabs[0]?.value ?? "new-in";
  const activeTab = tabs.some((tab) => tab.value === requestedTab)
    ? (requestedTab as TabValue)
    : defaultTab;

  let products = catalogProducts;
  let listingCategory: XaCategory | undefined;

  if (XA_ALLOWED_DEPARTMENTS.includes(activeTab as XaDepartment)) {
    products = catalogProducts.filter(
      (product) => product.taxonomy.department === activeTab,
    );
  }
  if (XA_ALLOWED_CATEGORIES.includes(activeTab as XaCategory)) {
    products = catalogProducts.filter(
      (product) => product.taxonomy.category === activeTab,
    );
    listingCategory = activeTab as XaCategory;
  }
  if (activeTab === "new-in") {
    const timestamps = catalogProducts.map((item) =>
      new Date(item.createdAt).getTime(),
    );
    const reference = timestamps.length ? Math.max(...timestamps) : Date.now();
    const cutoff = reference - 30 * 24 * 60 * 60 * 1000;
    products = catalogProducts.filter(
      (item) => new Date(item.createdAt).getTime() >= cutoff,
    );
  }

  const tabLabel = tabs.find((tab) => tab.value === activeTab)?.label ?? "Women";
  const title = `${designer.name} - ${tabLabel}`;

  return (
    <main className="sf-content">
      <Section padding="default">
        <div className="space-y-3">
          <Inline gap={3} alignY="center" className="flex-wrap">
            {tabs.map((tab) => (
              <Link
                key={tab.value}
                href={getDesignerHref(designer.handle, tab.value)}
                className={`text-sm font-medium ${activeTab === tab.value ? "underline" : ""}`}
              >
                {tab.label}
              </Link>
            ))}
          </Inline>
        </div>
      </Section>

      <Suspense fallback={null}>
        <XaProductListing
          title={title}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Designers", href: "/designers" },
            { label: designer.name },
          ]}
          products={products}
          category={listingCategory}
        />
      </Suspense>
    </main>
  );
}

export function DesignerPageClient(props: DesignerPageClientProps) {
  return (
    <Suspense fallback={null}>
      <DesignerContent {...props} />
    </Suspense>
  );
}
