import { notFound } from "next/navigation";

import { XaDepartmentLanding } from "../../components/XaDepartmentLanding";
import { isDepartmentAllowed } from "../../lib/xaCatalog";

export default function WomenLandingPage() {
  if (!isDepartmentAllowed("women")) notFound();
  return <XaDepartmentLanding department="women" />;
}
