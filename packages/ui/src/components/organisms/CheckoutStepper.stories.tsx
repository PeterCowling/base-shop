import { type Meta, type StoryObj } from "@storybook/nextjs";

import { CheckoutStepper } from "./CheckoutStepper";

const meta: Meta<typeof CheckoutStepper> = {
  title: "Organisms/CheckoutStepper",
  component: CheckoutStepper,
  args: {
    steps: ["Shipping", "Payment", "Review"],
    currentStep: 0,
  },
};
export default meta;

export const Default: StoryObj<typeof CheckoutStepper> = {};
