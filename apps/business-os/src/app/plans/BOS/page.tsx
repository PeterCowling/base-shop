import { generatePlanMetadata, PlanDocumentPage } from "../PlanDocumentPage";

export const dynamic = "force-static";

export default async function BosPlanPage() {
  return PlanDocumentPage({ businessCode: "BOS" });
}

export async function generateMetadata() {
  return generatePlanMetadata({ businessCode: "BOS" });
}

