import type { Column } from "../organisms/DataTable";
import { DataTable } from "../organisms/DataTable";
import type { StatItem } from "../organisms/StatsGrid";
import { StatsGrid } from "../organisms/StatsGrid";

export interface TrackingRecord {
  id: string;
  type: string;
  provider: string;
  status: string | null;
  updated?: string;
}

export interface TrackingDashboardTemplateProps {
  records: TrackingRecord[];
  stats?: StatItem[];
}

export function TrackingDashboardTemplate({
  records,
  stats = [],
}: TrackingDashboardTemplateProps) {
  const columns: Column<TrackingRecord>[] = [
    { header: "ID", render: (r) => r.id },
    { header: "Type", render: (r) => r.type },
    { header: "Provider", render: (r) => r.provider },
    { header: "Status", render: (r) => r.status ?? "" },
    { header: "Updated", render: (r) => r.updated ?? "" },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Tracking</h2>
      {stats.length > 0 && <StatsGrid items={stats} />}
      <DataTable rows={records} columns={columns} />
    </div>
  );
}
