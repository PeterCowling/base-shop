import type { Meta, StoryObj } from "@storybook/react";
import FinancingBadge from "./FinancingBadge";

const meta = {
  component: FinancingBadge,
  args: {
    provider: "klarna",
    apr: 0,
    termMonths: 12,
    price: 120,
    currency: "USD",
  },
} satisfies Meta<typeof FinancingBadge>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

