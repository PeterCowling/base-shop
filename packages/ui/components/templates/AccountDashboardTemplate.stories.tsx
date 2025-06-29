import { type Meta, type StoryObj } from "@storybook/react";
import type { Column } from "../organisms/DataTable";
import type { StatItem } from "../organisms/StatsGrid";
import { AccountDashboardTemplate } from "./AccountDashboardTemplate";

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

const meta: Meta<typeof AccountDashboardTemplate> = {
  component: AccountDashboardTemplate,
  args: {
    user,
    stats,
    orders,
    orderColumns,
  },
};
export default meta;

export const Default: StoryObj<typeof AccountDashboardTemplate> = {};
