import * as React from "react";
export interface StatItem {
    label: string;
    value: React.ReactNode;
}
export interface StatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
    items: StatItem[];
}
export declare function StatsGrid({ items, className, ...props }: StatsGridProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=StatsGrid.d.ts.map