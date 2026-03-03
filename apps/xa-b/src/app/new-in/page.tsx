"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { XaProductListing } from "../../components/XaProductListing.client";
import { XA_PRODUCTS } from "../../lib/demoData";
import { formatLabel, XA_DEPARTMENTS } from "../../lib/xaCatalog";
import type { XaDepartment } from "../../lib/xaTypes";

function NewInContent() {
  const searchParams = useSearchParams();

  const departmentParam = searchParams.get("department") ?? undefined;
  const allowedDepartments = new Set<XaDepartment>(
    XA_DEPARTMENTS.map((item) => item.slug as XaDepartment),
  );
  const department =
    departmentParam && allowedDepartments.has(departmentParam as XaDepartment)
      ? (departmentParam as XaDepartment)
      : undefined;

  const windowParam = searchParams.get("window") ?? undefined;
  const windowDays =
    windowParam === "day" ? 1 : windowParam === "week" ? 7 : 30;
  const baseProducts = department
    ? XA_PRODUCTS.filter((product) => product.taxonomy.department === department)
    : XA_PRODUCTS;
  const timestamps = baseProducts.map((product) =>
    new Date(product.createdAt).getTime(),
  );
  const reference = timestamps.length ? Math.max(...timestamps) : Date.now();
  const cutoff = reference - windowDays * 24 * 60 * 60 * 1000;
  const products = baseProducts.filter(
    (product) => new Date(product.createdAt).getTime() >= cutoff,
  );
  const title = department ? `New In: ${formatLabel(department)}` : "New In";

  return (
    <XaProductListing
      title={title}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "New In" }]}
      products={products}
    />
  );
}

export default function NewInPage() {
  return (
    <Suspense fallback={null}>
      <NewInContent />
    </Suspense>
  );
}
