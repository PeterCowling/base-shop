import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed,XA_SUBCATEGORIES } from "../../../../lib/xaCatalog";

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
