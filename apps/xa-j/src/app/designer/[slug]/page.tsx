/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy designer page pending i18n overhaul */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Section } from "@acme/ui/atoms/Section";

import { XaProductListing } from "../../../components/XaProductListing.client";
import { XA_BRANDS, XA_PRODUCTS } from "../../../lib/demoData";
import {
  XA_ALLOWED_CATEGORIES,
  XA_ALLOWED_DEPARTMENTS,
  XA_CATEGORY_LABELS,
  formatLabel,
} from "../../../lib/xaCatalog";
import type { XaCategory, XaDepartment } from "../../../lib/xaTypes";

type TabValue = XaDepartment | XaCategory | "new-in";

export default async function DesignerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const designer = XA_BRANDS.find((item) => item.handle === slug);
  if (!designer) notFound();

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

  const requestedTab = resolvedSearchParams?.tab ?? "";
  const defaultTab =
    departmentTabs[0]?.value ?? categoryTabs[0]?.value ?? "new-in";
  const activeTab = tabs.some((tab) => tab.value === requestedTab)
    ? (requestedTab as TabValue)
    : defaultTab;
  const designerProducts = XA_PRODUCTS.filter((product) => product.brand === slug);

  let products = designerProducts;
  let listingCategory: XaCategory | undefined;

  if (XA_ALLOWED_DEPARTMENTS.includes(activeTab as XaDepartment)) {
    products = designerProducts.filter(
      (product) => product.taxonomy.department === activeTab,
    );
  }
  if (XA_ALLOWED_CATEGORIES.includes(activeTab as XaCategory)) {
    products = designerProducts.filter(
      (product) => product.taxonomy.category === activeTab,
    );
    listingCategory = activeTab as XaCategory;
  }
  if (activeTab === "new-in") {
    const timestamps = designerProducts.map((item) => new Date(item.createdAt).getTime());
    const reference = timestamps.length ? Math.max(...timestamps) : Date.now();
    const cutoff = reference - 30 * 24 * 60 * 60 * 1000;
    products = designerProducts.filter(
      (item) => new Date(item.createdAt).getTime() >= cutoff,
    );
  }

  const tabLabel = tabs.find((tab) => tab.value === activeTab)?.label ?? "Women";
  const title = `${designer.name} - ${tabLabel}`;

  return (
    <main className="sf-content">
      <Section padding="default">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {tabs.map((tab) => (
              <Link
                key={tab.value}
                href={`/designer/${designer.handle}?tab=${tab.value}`}
                className={`text-sm font-medium ${activeTab === tab.value ? "underline" : ""}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
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
