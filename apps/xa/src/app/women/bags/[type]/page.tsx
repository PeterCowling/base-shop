import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../../components/XaDepartmentListing";
import { XA_SUBCATEGORIES, isCategoryAllowed, isDepartmentAllowed } from "../../../../lib/xaCatalog";

export default async function WomenBagsTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  if (!isDepartmentAllowed("women") || !isCategoryAllowed("bags")) notFound();
  if (!XA_SUBCATEGORIES.bags.includes(type)) notFound();

  return (
    <XaDepartmentListing
      department="women"
      category="bags"
      subcategory={type}
    />
  );
}
