import { type Meta, type StoryObj } from "@storybook/react";
import { OrderTrackingTemplate } from "./OrderTrackingTemplate";

const meta: Meta<typeof OrderTrackingTemplate> = {
  component: OrderTrackingTemplate,
  args: {
    orderId: "ABC123",
    address: "123 Main St",
    shippingSteps: [
      { label: "Ordered", date: "2023-01-01", complete: true },
      { label: "Shipped", date: "2023-01-02", complete: true },
    ],
    returnSteps: [
      { label: "Delivered", date: "2023-01-03" },
    ],
  },
  argTypes: {
    orderId: { control: "text" },
    address: { control: "text" },
    shippingSteps: { control: "object" },
    returnSteps: { control: "object" },
  },
};
export default meta;

export const Default: StoryObj<typeof OrderTrackingTemplate> = {};
