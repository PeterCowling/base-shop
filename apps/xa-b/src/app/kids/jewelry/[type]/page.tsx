import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed,XA_SUBCATEGORIES } from "../../../../lib/xaCatalog";

export function generateStaticParams() {
  return XA_SUBCATEGORIES.jewelry.map((t) => ({ type: t }));
}

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
