import { notFound } from "next/navigation";

import { XaDepartmentListing } from "../../../components/XaDepartmentListing";
import { isCategoryAllowed, isDepartmentAllowed } from "../../../lib/xaCatalog";

export default function MenBagsPage() {
  if (!isDepartmentAllowed("men") || !isCategoryAllowed("bags")) notFound();
  return <XaDepartmentListing department="men" category="bags" />;
}
