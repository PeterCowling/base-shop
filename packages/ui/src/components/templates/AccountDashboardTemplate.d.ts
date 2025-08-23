import * as React from "react";
import type { Column } from "../organisms/DataTable";
import type { StatItem } from "../organisms/StatsGrid";
export interface AccountDashboardTemplateProps<T> extends React.HTMLAttributes<HTMLDivElement> {
    user: {
        /** Full name shown beside the avatar */
        name: string;
        /** Primary e-mail address */
        email: string;
        /** Optional absolute/relative URL for the avatar image */
        avatar?: string;
    };
    /** KPI cards displayed below the user header */
    stats?: StatItem[];
    /** Order rows rendered in the table */
    orders?: T[];
    /** Column metadata for the order table */
    orderColumns?: Column<T>[];
}
/**
 * Generic dashboard layout for an authenticated shopper.
 * Supply `<T>` as the row type for orders (e.g. `OrderRow`).
 */
export declare function AccountDashboardTemplate<T>({ user, stats, orders, orderColumns, className, ...props }: AccountDashboardTemplateProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AccountDashboardTemplate.d.ts.map