import { Suspense } from "react";

import { XaProductListing } from "./XaProductListing.client";
import { XA_PRODUCTS } from "../lib/demoData";
import { XA_CATEGORY_LABELS, filterByCategory, filterByDepartment, formatLabel } from "../lib/xaCatalog";
import type { XaCategory, XaDepartment } from "../lib/xaTypes";

export function XaDepartmentListing({
  department,
  category,
  subcategory,
}: {
  department: XaDepartment;
  category: XaCategory;
  subcategory?: string;
}) {
  const departmentLabel = formatLabel(department);
  const categoryLabel = XA_CATEGORY_LABELS[category];
  const subLabel = subcategory ? formatLabel(subcategory) : null;

  const departmentProducts = filterByDepartment(XA_PRODUCTS, department);
  const categoryProducts = filterByCategory(departmentProducts, category);
  const products = subcategory
    ? categoryProducts.filter((product) => product.taxonomy.subcategory === subcategory)
    : categoryProducts;

  const title = subLabel
    ? `${departmentLabel} ${categoryLabel}: ${subLabel}`
    : `${departmentLabel} ${categoryLabel}`;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: departmentLabel, href: `/${department}` },
    { label: categoryLabel, href: `/${department}/${category}` },
    ...(subLabel ? [{ label: subLabel }] : []),
  ];

  return (
    <Suspense fallback={null}>
      <XaProductListing
        title={title}
        breadcrumbs={breadcrumbs}
        products={products}
        category={category}
        showTypeFilter={!subcategory}
      />
    </Suspense>
  );
}
