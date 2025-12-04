import { type Meta, type StoryObj } from "@storybook/nextjs";
import { CheckoutTemplate } from "./CheckoutTemplate";

const steps = [
  { label: "Shipping", content: <div>Shipping info</div> },
  { label: "Payment", content: <div>Payment details</div> },
  { label: "Review", content: <div>Review order</div> },
];

const meta: Meta<typeof CheckoutTemplate> = {
  title: "Templates/CheckoutTemplate",
  component: CheckoutTemplate,
  args: { steps },
};
export default meta;

export const Default: StoryObj<typeof CheckoutTemplate> = {};
