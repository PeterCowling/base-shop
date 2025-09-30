import { type Meta, type StoryObj } from "@storybook/react";
import { CheckoutStepper } from "./CheckoutStepper";

const meta = {
  component: CheckoutStepper,
  args: {
    steps: ["Shipping", "Payment", "Review"],
    currentStep: 0,
  },
} satisfies Meta<typeof CheckoutStepper>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
