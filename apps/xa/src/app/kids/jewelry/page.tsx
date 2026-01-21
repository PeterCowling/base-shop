import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed } from "../../../lib/xaCatalog";

export default function KidsJewelryPage() {
  if (!isDepartmentAllowed("kids") || !isCategoryAllowed("jewelry")) notFound();
  return <XaDepartmentListing department="kids" category="jewelry" />;
}
