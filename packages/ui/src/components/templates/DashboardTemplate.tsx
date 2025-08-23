// packages/ui/components/templates/DashboardTemplate.tsx

import { StatsGrid, type StatItem } from "../organisms/StatsGrid";

export interface DashboardTemplateProps {
  stats: StatItem[];
}

export function DashboardTemplate({ stats }: DashboardTemplateProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <StatsGrid items={stats} />
    </div>
  );
}
