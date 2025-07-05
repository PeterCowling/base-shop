import { type Meta, type StoryObj } from "@storybook/react";
import { LoyaltyHubTemplate } from "./LoyaltyHubTemplate";

const meta: Meta<typeof LoyaltyHubTemplate> = {
  component: LoyaltyHubTemplate,
  args: {
    stats: [
      { label: "Points", value: 1200 },
      { label: "Tier", value: "Gold" },
    ],
    progress: { current: 600, goal: 1000, label: "Progress" },
    historyRows: [
      { date: "2023-01-01", action: "Earned", amount: 100 },
      { date: "2023-01-02", action: "Spent", amount: -50 },
    ],
    historyColumns: [
      { header: "Date", render: (row: any) => row.date },
      { header: "Action", render: (row: any) => row.action },
      { header: "Amount", render: (row: any) => row.amount },
    ],
  },
  argTypes: {
    stats: { control: "object" },
    progress: { control: "object" },
    historyRows: { control: "object" },
    historyColumns: { control: "object" },
  },
};
export default meta;

export const Default: StoryObj<typeof LoyaltyHubTemplate> = {};
