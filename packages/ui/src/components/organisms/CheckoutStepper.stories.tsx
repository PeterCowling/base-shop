import { type Meta, type StoryObj } from "@storybook/react";
import { CheckoutStepper } from "./CheckoutStepper";

const meta: Meta<typeof CheckoutStepper> = {
  component: CheckoutStepper,
  args: {
    steps: ["Shipping", "Payment", "Review"],
    currentStep: 0,
  },
};
export default meta;

export const Default: StoryObj<typeof CheckoutStepper> = {};
