import * as React from "react";
import type { Column } from "../organisms/DataTable";
import type { StatItem } from "../organisms/StatsGrid";
export interface AccountDashboardTemplateProps<T> extends React.HTMLAttributes<HTMLDivElement> {
    user: {
        name: string;
        email: string;
        avatar?: string;
    };
    stats?: StatItem[];
    orders?: T[];
    orderColumns?: Column<T>[];
}
export declare function AccountDashboardTemplate<T>({ user, stats, orders, orderColumns, className, ...props }: AccountDashboardTemplateProps<T>): React.JSX.Element;
