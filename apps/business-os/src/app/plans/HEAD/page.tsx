import { generatePlanMetadata, PlanDocumentPage } from "../PlanDocumentPage";

export const dynamic = "force-static";

export default async function HeadPlanPage() {
  return PlanDocumentPage({ businessCode: "HEAD" });
}

export async function generateMetadata() {
  return generatePlanMetadata({ businessCode: "HEAD" });
}
