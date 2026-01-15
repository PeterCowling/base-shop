import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed } from "../../../lib/xaCatalog";

export default function WomenJewelryPage() {
  if (!isDepartmentAllowed("women") || !isCategoryAllowed("jewelry")) notFound();
  return <XaDepartmentListing department="women" category="jewelry" />;
}
