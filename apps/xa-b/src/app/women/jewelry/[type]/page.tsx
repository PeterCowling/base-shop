import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed,XA_SUBCATEGORIES } from "../../../../lib/xaCatalog";

export function generateStaticParams() {
  return XA_SUBCATEGORIES.jewelry.map((t) => ({ type: t }));
}

export default async function WomenJewelryTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  if (!isDepartmentAllowed("women") || !isCategoryAllowed("jewelry")) notFound();
  if (!XA_SUBCATEGORIES.jewelry.includes(type)) notFound();

  return (
    <XaDepartmentListing
      department="women"
      category="jewelry"
      subcategory={type}
    />
  );
}
