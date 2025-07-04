/// <reference types="react" />
import { StatItem } from "../organisms/StatsGrid";
export interface DashboardTemplateProps {
    stats: StatItem[];
}
export declare function DashboardTemplate({ stats }: DashboardTemplateProps): import("react").JSX.Element;
