import { generatePlanMetadata, PlanDocumentPage } from "../PlanDocumentPage";

export const dynamic = "force-static";

export default async function HbagPlanPage() {
  return PlanDocumentPage({ businessCode: "HBAG" });
}

export async function generateMetadata() {
  return generatePlanMetadata({ businessCode: "HBAG" });
}
