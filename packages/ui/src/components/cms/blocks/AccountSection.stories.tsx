import type { Meta, StoryObj } from "@storybook/react";
import AccountSection from "./AccountSection";

const meta: Meta<typeof AccountSection> = {
  component: AccountSection,
  args: {
    showDashboard: true,
    showOrders: true,
    showRentals: true,
    showAddresses: true,
    showPayments: true,
    ordersAdapter: async () => [
      { id: "1001", total: 199, date: new Date().toISOString(), status: "paid" },
      { id: "1002", total: 89, date: new Date().toISOString(), status: "paid" },
    ],
    rentalsAdapter: async () => [
      { id: "r-1", sessionId: "s", shop: "shop", deposit: 50, startedAt: new Date().toISOString() },
    ] as any,
  },
};
export default meta;

export const Default: StoryObj<typeof AccountSection> = {};

