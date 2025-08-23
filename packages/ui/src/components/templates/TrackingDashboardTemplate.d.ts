import type { StatItem } from "../organisms/StatsGrid";
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
export declare function TrackingDashboardTemplate({ records, stats, }: TrackingDashboardTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=TrackingDashboardTemplate.d.ts.map