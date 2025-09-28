// packages/ui/components/templates/AccountDashboardTemplate.stories.tsx

import { Meta, StoryObj } from "@storybook/react";
import React from "react";

import type { Column } from "../organisms/DataTable";
import type { StatItem } from "../organisms/StatsGrid";
import {
  AccountDashboardTemplate,
  type AccountDashboardTemplateProps,
} from "./AccountDashboardTemplate";

/* ------------------------------------------------------------------ *
 *  Row model & mock data
 * ------------------------------------------------------------------ */
interface OrderRow {
  id: number;
  total: string;
}

const user = {
  name: "Jane Doe",
  email: "jane@example.com",
  avatar: "https://placehold.co/40",
};

const stats: StatItem[] = [
  { label: "Orders", value: 12 },
  { label: "Wishlist", value: 3 },
];

const orders: OrderRow[] = [
  { id: 1, total: "$10" },
  { id: 2, total: "$20" },
];

const orderColumns: Column<OrderRow>[] = [
  { header: "ID", render: (r) => r.id },
  { header: "Total", render: (r) => r.total },
];

/* ------------------------------------------------------------------ *
 *  Generic-aware wrapper
 * ------------------------------------------------------------------ *
 *  Storybook cannot infer generics, so we expose a tiny wrapper
 *  component with the <OrderRow> type baked in.
 * ------------------------------------------------------------------ */
const DashboardForOrders: React.FC<AccountDashboardTemplateProps<OrderRow>> = (
  props
) => <AccountDashboardTemplate<OrderRow> {...props} />;

/* ------------------------------------------------------------------ *
 *  Storybook meta
 * ------------------------------------------------------------------ */
const meta: Meta<typeof DashboardForOrders> = {
  title: "Templates/Account Dashboard",
  component: DashboardForOrders,
  parameters: {
    docs: {
      description: {
        component: "Authenticated shopper dashboard template with user header, KPI cards and orders table.",
      },
    },
  },
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
export const Default: StoryObj<typeof DashboardForOrders> = {};
