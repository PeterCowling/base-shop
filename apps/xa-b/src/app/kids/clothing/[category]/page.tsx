import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed,XA_SUBCATEGORIES } from "../../../../lib/xaCatalog";

export default async function KidsClothingCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isDepartmentAllowed("kids") || !isCategoryAllowed("clothing")) notFound();
  if (!XA_SUBCATEGORIES.clothing.includes(category)) {
    notFound();
  }
  return (
    <XaDepartmentListing
      department="kids"
      category="clothing"
      subcategory={category}
    />
  );
}
