import type { Meta, StoryObj } from "@storybook/react";
import FinancingBadge from "./FinancingBadge";

const meta: Meta<typeof FinancingBadge> = {
  component: FinancingBadge,
  args: {
    provider: "klarna",
    apr: 0,
    termMonths: 12,
    price: 120,
    currency: "USD",
  },
};
export default meta;

export const Default: StoryObj<typeof FinancingBadge> = {};

