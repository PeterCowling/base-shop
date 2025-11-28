import { type Meta, type StoryObj } from "@storybook/nextjs";
import { OrderTrackingTemplate } from "./OrderTrackingTemplate";

const meta: Meta<typeof OrderTrackingTemplate> = {
  component: OrderTrackingTemplate,
  args: {
    orderId: "ABC123",
    address: "123 Main St",
    steps: [
      { label: "Ordered", date: "2023-01-01", complete: true },
      { label: "Shipped", date: "2023-01-02", complete: true },
      { label: "Delivered", date: "2023-01-03" },
    ],
  },
  argTypes: {
    orderId: { control: "text" },
    address: { control: "text" },
    steps: { control: "object" },
  },
};
export default meta;

export const Default: StoryObj<typeof OrderTrackingTemplate> = {};
