// apps/cms/src/app/cms/ra/page.tsx
import { listReturnAuthorizations } from "@acme/platform-core/returnAuthorization";
import { features } from "@acme/platform-core/features";
import { notFound } from "next/navigation";
import type { ReturnAuthorization } from "@acme/types";
import RaDashboard from "./RaDashboardClient";

export const revalidate = 0;

export default async function RaDashboardPage() {
  if (!features.raTicketing) notFound();
  let ras: ReturnAuthorization[] = [];
  let error: string | null = null;
  try {
    ras = await listReturnAuthorizations();
  } catch (err) {
    error = (err as Error).message ?? "Failed to load return authorizations";
  }
  return <RaDashboard ras={ras} error={error} />;
}
