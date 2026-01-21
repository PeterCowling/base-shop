import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../../components/XaDepartmentListing";
import { XA_SUBCATEGORIES, isCategoryAllowed, isDepartmentAllowed } from "../../../../lib/xaCatalog";

export default async function WomenClothingCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!isDepartmentAllowed("women") || !isCategoryAllowed("clothing")) notFound();
  if (!XA_SUBCATEGORIES.clothing.includes(category)) notFound();

  return (
    <XaDepartmentListing
      department="women"
      category="clothing"
      subcategory={category}
    />
  );
}
