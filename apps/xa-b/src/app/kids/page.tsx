import { notFound } from "next/navigation";

import { XaDepartmentLanding } from "../../components/XaDepartmentLanding";
import { isDepartmentAllowed } from "../../lib/xaCatalog";

export default function KidsLandingPage() {
  if (!isDepartmentAllowed("kids")) notFound();
  return <XaDepartmentLanding department="kids" />;
}
