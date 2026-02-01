import { generatePlanMetadata, PlanDocumentPage } from "../PlanDocumentPage";

export const dynamic = "force-static";

export default async function PlatPlanPage() {
  return PlanDocumentPage({ businessCode: "PLAT" });
}

export async function generateMetadata() {
  return generatePlanMetadata({ businessCode: "PLAT" });
}

