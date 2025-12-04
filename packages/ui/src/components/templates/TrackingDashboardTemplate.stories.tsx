import type { Meta, StoryObj } from "@storybook/react";
import { TrackingDashboardTemplate } from "./TrackingDashboardTemplate";

const meta: Meta<typeof TrackingDashboardTemplate> = {
  title: "Templates/TrackingDashboardTemplate",
  component: TrackingDashboardTemplate,
  args: {
    stats: [
      { label: "Shipments", value: "128" },
      { label: "In transit", value: "32" },
      { label: "Delivered", value: "90" },
    ],
    activity: [
      { id: "1", title: "Order #12345", status: "Shipped", timestamp: "2024-05-01" },
      { id: "2", title: "Order #12346", status: "In transit", timestamp: "2024-05-02" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof TrackingDashboardTemplate>;
const baseArgs = meta.args!;

export const Default: Story = {};
export const Loading: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "loading" },
};
export const Empty: Story = {
  args: { stats: [], activity: [] },
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
