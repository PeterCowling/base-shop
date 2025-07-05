import { jsx as _jsx } from "react/jsx-runtime";
import { AccountDashboardTemplate, } from "./AccountDashboardTemplate";
const user = {
    name: "Jane Doe",
    email: "jane@example.com",
    avatar: "https://placehold.co/40",
};
const stats = [
    { label: "Orders", value: 12 },
    { label: "Wishlist", value: 3 },
];
const orders = [
    { id: 1, total: "$10" },
    { id: 2, total: "$20" },
];
const orderColumns = [
    { header: "ID", render: (r) => r.id },
    { header: "Total", render: (r) => r.total },
];
/* ------------------------------------------------------------------ *
 *  Generic-aware wrapper
 * ------------------------------------------------------------------ *
 *  Storybook cannot infer generics, so we expose a tiny wrapper
 *  component with the <OrderRow> type baked in.
 * ------------------------------------------------------------------ */
const DashboardForOrders = (props) => _jsx(AccountDashboardTemplate, { ...props });
/* ------------------------------------------------------------------ *
 *  Storybook meta
 * ------------------------------------------------------------------ */
const meta = {
    title: "Templates/Account Dashboard",
    component: DashboardForOrders,
    args: {
        user,
        stats,
        orders,
        orderColumns,
    },
};
export default meta;
/* ------------------------------------------------------------------ *
 *  Stories
 * ------------------------------------------------------------------ */
export const Default = {};
