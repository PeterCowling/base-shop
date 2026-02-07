import { notFound } from "next/navigation";

import { XaDepartmentLanding } from "../../components/XaDepartmentLanding";
import { isDepartmentAllowed } from "../../lib/xaCatalog";

export default function MenLandingPage() {
  if (!isDepartmentAllowed("men")) notFound();
  return <XaDepartmentLanding department="men" />;
}
