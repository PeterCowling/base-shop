import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../../components/XaDepartmentListing";
import { XA_SUBCATEGORIES, isCategoryAllowed, isDepartmentAllowed } from "../../../../lib/xaCatalog";

export default async function KidsJewelryTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isDepartmentAllowed("kids") || !isCategoryAllowed("jewelry")) notFound();
  if (!XA_SUBCATEGORIES.jewelry.includes(type)) {
    notFound();
  }
  return (
    <XaDepartmentListing
      department="kids"
      category="jewelry"
      subcategory={type}
    />
  );
}
