// apps/cms/src/app/cms/shop/[shop]/settings/maintenance-scan/page.tsx
import dynamic from "next/dynamic";

const MaintenanceSchedulerEditor = dynamic(() => import("./MaintenanceSchedulerEditor"));
void MaintenanceSchedulerEditor;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function MaintenanceScanSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Maintenance Scan – {shop}</h2>
      <MaintenanceSchedulerEditor />
    </div>
  );
}

