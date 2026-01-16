import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed } from "../../../lib/xaCatalog";

export default function MenJewelryPage() {
  if (!isDepartmentAllowed("men") || !isCategoryAllowed("jewelry")) notFound();
  return <XaDepartmentListing department="men" category="jewelry" />;
}
