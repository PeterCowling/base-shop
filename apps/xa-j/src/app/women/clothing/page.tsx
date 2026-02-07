import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed } from "../../../lib/xaCatalog";

export default function WomenClothingPage() {
  if (!isDepartmentAllowed("women") || !isCategoryAllowed("clothing")) notFound();
  return <XaDepartmentListing department="women" category="clothing" />;
}
