import { generatePlanMetadata, PlanDocumentPage } from "../PlanDocumentPage";

export const dynamic = "force-static";

export default async function PipePlanPage() {
  return PlanDocumentPage({ businessCode: "PIPE" });
}

export async function generateMetadata() {
  return generatePlanMetadata({ businessCode: "PIPE" });
}
