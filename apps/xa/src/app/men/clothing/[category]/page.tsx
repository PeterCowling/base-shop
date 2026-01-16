import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../../components/XaDepartmentListing";
import { XA_SUBCATEGORIES, isCategoryAllowed, isDepartmentAllowed } from "../../../../lib/xaCatalog";

export default async function MenClothingCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!isDepartmentAllowed("men") || !isCategoryAllowed("clothing")) notFound();
  if (!XA_SUBCATEGORIES.clothing.includes(category)) notFound();

  return (
    <XaDepartmentListing
      department="men"
      category="clothing"
      subcategory={category}
    />
  );
}
