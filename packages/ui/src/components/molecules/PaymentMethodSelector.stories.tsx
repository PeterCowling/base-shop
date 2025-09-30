import type { Meta, StoryObj } from "@storybook/react";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

const meta = {
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
} satisfies Meta<typeof PaymentMethodSelector>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
