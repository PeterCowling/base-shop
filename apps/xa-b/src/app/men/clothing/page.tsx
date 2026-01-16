import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed } from "../../../lib/xaCatalog";

export default function MenClothingPage() {
  if (!isDepartmentAllowed("men") || !isCategoryAllowed("clothing")) notFound();
  return <XaDepartmentListing department="men" category="clothing" />;
}
