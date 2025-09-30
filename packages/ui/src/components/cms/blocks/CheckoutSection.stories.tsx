import type { Meta, StoryObj } from "@storybook/react";
import CheckoutSection from "./CheckoutSection";

const meta = {
  component: CheckoutSection,
  args: {
    showWallets: true,
    showBNPL: true,
  },
} satisfies Meta<typeof CheckoutSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

