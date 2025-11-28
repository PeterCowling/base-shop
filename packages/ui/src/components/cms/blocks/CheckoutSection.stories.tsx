import type { Meta, StoryObj } from "@storybook/nextjs";
import CheckoutSection from "./CheckoutSection";

const meta: Meta<typeof CheckoutSection> = {
  component: CheckoutSection,
  args: {
    showWallets: true,
    showBNPL: true,
  },
};
export default meta;

export const Default: StoryObj<typeof CheckoutSection> = {};

