import { generatePlanMetadata, PlanDocumentPage } from "../PlanDocumentPage";

export const dynamic = "force-static";

export default async function XaPlanPage() {
  return PlanDocumentPage({ businessCode: "XA" });
}

export async function generateMetadata() {
  return generatePlanMetadata({ businessCode: "XA" });
}
