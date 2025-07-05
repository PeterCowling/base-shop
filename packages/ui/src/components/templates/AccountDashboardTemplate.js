import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
import { Avatar } from "../atoms/Avatar";
import { DataTable } from "../organisms/DataTable";
import { StatsGrid } from "../organisms/StatsGrid";
/**
 * Generic dashboard layout for an authenticated shopper.
 * Supply `<T>` as the row type for orders (e.g. `OrderRow`).
 */
export function AccountDashboardTemplate({ user, stats = [], orders = [], orderColumns = [], className, ...props }) {
    return (_jsxs("div", { className: cn("space-y-6", className), ...props, children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Avatar
                    /* Next <Image> forbids undefined → fall back to “empty string” */
                    , { 
                        /* Next <Image> forbids undefined → fall back to “empty string” */
                        src: user.avatar ?? "", alt: user.name, size: 40 }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold", children: user.name }), _jsx("p", { className: "text-muted-foreground text-sm", children: user.email })] })] }), stats.length > 0 && _jsx(StatsGrid, { items: stats }), orders.length > 0 && orderColumns.length > 0 && (_jsx(DataTable, { rows: orders, columns: orderColumns }))] }));
}
