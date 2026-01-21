import type { Meta, StoryObj } from "@storybook/nextjs";

import FinancingBadge from "./FinancingBadge";

const meta: Meta<typeof FinancingBadge> = {
  title: "CMS Blocks/FinancingBadge",
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

