import { Suspense } from "react";

import { XaProductListing } from "../../components/XaProductListing.client";
import { XA_PRODUCTS } from "../../lib/demoData";
import { formatLabel,XA_DEPARTMENTS } from "../../lib/xaCatalog";
import type { XaDepartment } from "../../lib/xaTypes";

export default async function NewInPage({
  searchParams,
}: {
  searchParams?: Promise<URLSearchParams | { department?: string; window?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  const departmentParam =
    resolvedSearchParams instanceof URLSearchParams
      ? resolvedSearchParams.get("department") ?? undefined
      : resolvedSearchParams?.department;
  const allowedDepartments = new Set<XaDepartment>(
    XA_DEPARTMENTS.map((item) => item.slug as XaDepartment),
  );
  const department =
    departmentParam && allowedDepartments.has(departmentParam as XaDepartment)
      ? (departmentParam as XaDepartment)
      : undefined;

  const windowParam =
    resolvedSearchParams instanceof URLSearchParams
      ? resolvedSearchParams.get("window") ?? undefined
      : resolvedSearchParams?.window;
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
    <Suspense fallback={null}>
      <XaProductListing
        title={title}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "New In" }]}
        products={products}
      />
    </Suspense>
  );
}
