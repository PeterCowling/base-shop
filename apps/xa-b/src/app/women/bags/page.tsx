import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed } from "../../../lib/xaCatalog";

export default function WomenBagsPage() {
  if (!isDepartmentAllowed("women") || !isCategoryAllowed("bags")) notFound();
  return <XaDepartmentListing department="women" category="bags" />;
}
