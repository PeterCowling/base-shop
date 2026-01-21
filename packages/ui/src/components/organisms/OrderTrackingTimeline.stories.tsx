import { type Meta, type StoryObj } from "@storybook/nextjs";

import { OrderTrackingTimeline } from "./OrderTrackingTimeline";

const meta: Meta<typeof OrderTrackingTimeline> = {
  title: "Organisms/OrderTrackingTimeline",
  component: OrderTrackingTimeline,
  args: {
    itemSpacing: "space-y-6",
    steps: [
      { label: "Order placed", date: "2023-01-01", complete: true },
      { label: "Shipped", date: "2023-01-02", complete: true },
      { label: "Out for delivery", date: "2023-01-03", complete: false },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof OrderTrackingTimeline> = {};
// i18n-exempt -- Storybook demo copy
