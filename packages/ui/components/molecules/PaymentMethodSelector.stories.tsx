import type { Meta, StoryObj } from "@storybook/react";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

const meta: Meta<typeof PaymentMethodSelector> = {
  component: PaymentMethodSelector,
  args: {
    methods: [
      { value: "card", label: "Credit Card" },
      { value: "paypal", label: "PayPal" },
    ],
    value: "card",
  },
  argTypes: {
    onChange: { action: "change" },
  },
};
export default meta;

export const Default: StoryObj<typeof PaymentMethodSelector> = {};
