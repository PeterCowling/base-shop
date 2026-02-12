import { generatePlanMetadata, PlanDocumentPage } from "../PlanDocumentPage";

export const dynamic = "force-static";

export default async function PetPlanPage() {
  return PlanDocumentPage({ businessCode: "PET" });
}

export async function generateMetadata() {
  return generatePlanMetadata({ businessCode: "PET" });
}
