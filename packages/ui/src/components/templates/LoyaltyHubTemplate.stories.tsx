import { type Meta, type StoryObj } from "@storybook/react";
import { LoyaltyHubTemplate } from "./LoyaltyHubTemplate";
import type { Column } from "../organisms/DataTable";

interface HistoryRow {
  date: string;
  action: string;
  amount: number;
}

const historyRows: HistoryRow[] = [
  { date: "2023-01-01", action: "Earned", amount: 100 },
  { date: "2023-01-02", action: "Spent", amount: -50 },
];

const historyColumns: Column<HistoryRow>[] = [
  { header: "Date", render: (row) => row.date },
  { header: "Action", render: (row) => row.action },
  { header: "Amount", render: (row) => row.amount },
];

const meta: Meta<typeof LoyaltyHubTemplate<HistoryRow>> = {
  component: LoyaltyHubTemplate,
  args: {
    stats: [
      { label: "Points", value: 1200 },
      { label: "Tier", value: "Gold" },
    ],
    progress: { current: 600, goal: 1000, label: "Progress" },
    historyRows,
    historyColumns,
  },
  argTypes: {
    stats: { control: "object" },
    progress: { control: "object" },
    historyRows: { control: "object" },
    historyColumns: { control: "object" },
  },
};
export default meta;

export const Default: StoryObj<typeof LoyaltyHubTemplate<HistoryRow>> = {};
