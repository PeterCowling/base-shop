import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../../components/XaDepartmentListing";
import { XA_SUBCATEGORIES, isCategoryAllowed, isDepartmentAllowed } from "../../../../lib/xaCatalog";

export default async function MenJewelryTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  if (!isDepartmentAllowed("men") || !isCategoryAllowed("jewelry")) notFound();
  if (!XA_SUBCATEGORIES.jewelry.includes(type)) notFound();

  return (
    <XaDepartmentListing
      department="men"
      category="jewelry"
      subcategory={type}
    />
  );
}
