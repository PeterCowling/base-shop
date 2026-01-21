import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed } from "../../../lib/xaCatalog";

export default function KidsClothingPage() {
  if (!isDepartmentAllowed("kids") || !isCategoryAllowed("clothing")) notFound();
  return <XaDepartmentListing department="kids" category="clothing" />;
}
