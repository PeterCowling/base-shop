import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed } from "../../../lib/xaCatalog";

export default function KidsBagsPage() {
  if (!isDepartmentAllowed("kids") || !isCategoryAllowed("bags")) notFound();
  return <XaDepartmentListing department="kids" category="bags" />;
}
