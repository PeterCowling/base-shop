import { generatePlanMetadata, PlanDocumentPage } from "../PlanDocumentPage";

export const dynamic = "force-static";

export default async function BrikPlanPage() {
  return PlanDocumentPage({ businessCode: "BRIK" });
}

export async function generateMetadata() {
  return generatePlanMetadata({ businessCode: "BRIK" });
}

