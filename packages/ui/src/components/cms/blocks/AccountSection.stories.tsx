import type { Meta, StoryObj } from "@storybook/nextjs";
import AccountSection from "./AccountSection";
import type { RentalOrder } from "@acme/types";

const meta: Meta<typeof AccountSection> = {
  title: "CMS Blocks/AccountSection",
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
    ] as RentalOrder[],
  },
};
export default meta;

export const Default: StoryObj<typeof AccountSection> = {};
