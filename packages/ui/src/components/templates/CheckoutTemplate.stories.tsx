import { type Meta, type StoryObj } from "@storybook/react";
import { CheckoutTemplate } from "./CheckoutTemplate";

const steps = [
  { label: "Shipping", content: <div>Shipping info</div> },
  { label: "Payment", content: <div>Payment details</div> },
  { label: "Review", content: <div>Review order</div> },
];

const meta: Meta<typeof CheckoutTemplate> = {
  component: CheckoutTemplate,
  args: { steps },
};
export default meta;

export const Default: StoryObj<typeof CheckoutTemplate> = {};
