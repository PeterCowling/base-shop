import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

const meta: Meta<typeof PaymentMethodSelector> = {
  title: "Molecules/PaymentMethodSelector",
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
