import { type Meta, type StoryObj } from "@storybook/react";
import { CheckoutTemplate } from "./CheckoutTemplate";

const steps = [
  { label: "Shipping", content: <div>Shipping info</div> },
  { label: "Payment", content: <div>Payment details</div> },
  { label: "Review", content: <div>Review order</div> },
];

const meta = {
  component: CheckoutTemplate,
  args: { steps },
} satisfies Meta<typeof CheckoutTemplate>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
