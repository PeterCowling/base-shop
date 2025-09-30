import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

const meta: Meta<typeof PaymentMethodSelector> = {
  component: PaymentMethodSelector,
  args: {
    methods: [
      { value: "card", label: "Credit Card" },
      { value: "paypal", label: "PayPal" },
    ],
    value: "card",
    onChange: fn(),
  },
};
export default meta;

export const Default: StoryObj<typeof PaymentMethodSelector> = {};
