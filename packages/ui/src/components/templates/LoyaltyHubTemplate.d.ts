import * as React from "react";
import type { Column } from "../organisms/DataTable";
import type { StatItem } from "../organisms/StatsGrid";
export interface LoyaltyProgress {
    current: number;
    goal: number;
    label?: string;
}
export interface LoyaltyHubTemplateProps<T> extends React.HTMLAttributes<HTMLDivElement> {
    stats: StatItem[];
    progress?: LoyaltyProgress;
    historyRows: T[];
    historyColumns: Column<T>[];
}
export declare function LoyaltyHubTemplate<T>({ stats, progress, historyRows, historyColumns, className, ...props }: LoyaltyHubTemplateProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LoyaltyHubTemplate.d.ts.map