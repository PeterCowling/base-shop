import { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";

import type { Column } from "../organisms/DataTable";
import {
  LoyaltyHubTemplate,
  type LoyaltyHubTemplateProps,
} from "./LoyaltyHubTemplate";

/* ------------------------------------------------------------------ *
 *  Row model & mock data
 * ------------------------------------------------------------------ */
interface HistoryRow {
  date: string;
  action: string;
  amount: number;
}

const stats = [
  { label: "Points", value: 1200 },
  { label: "Tier", value: "Gold" },
];

const progress = { current: 600, goal: 1000, label: "Progress" };

const historyRows: HistoryRow[] = [
  { date: "2023-01-01", action: "Earned", amount: 100 },
  { date: "2023-01-02", action: "Spent", amount: -50 },
];

const historyColumns = [
  { header: "Date", render: (row: HistoryRow) => row.date },
  { header: "Action", render: (row: HistoryRow) => row.action },
  { header: "Amount", render: (row: HistoryRow) => row.amount },
] satisfies Column<HistoryRow>[];

/* ------------------------------------------------------------------ *
 *  Generic-aware wrapper
 * ------------------------------------------------------------------ */
const LoyaltyHubForHistory: React.FC<LoyaltyHubTemplateProps<HistoryRow>> = (
  props,
) => <LoyaltyHubTemplate<HistoryRow> {...props} />;

/* ------------------------------------------------------------------ *
 *  Storybook meta
 * ------------------------------------------------------------------ */
const meta: Meta<typeof LoyaltyHubForHistory> = {
  title: "Templates/Loyalty Hub",
  component: LoyaltyHubForHistory,
  args: {
    stats,
    progress,
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

/* ------------------------------------------------------------------ *
 *  Stories
 * ------------------------------------------------------------------ */
type Story = StoryObj<typeof LoyaltyHubForHistory>;
const baseArgs = meta.args!;

export const Default: Story = {};
export const Loading: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "loading" },
};
export const Empty: Story = {
  args: { stats: [], progress: { current: 0, goal: 0, label: "" }, historyRows: [], historyColumns },
  parameters: { dataState: "empty" },
};
export const Error: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "error" },
};
export const RTL: Story = {
  args: { ...baseArgs },
  parameters: { rtl: true },
};
