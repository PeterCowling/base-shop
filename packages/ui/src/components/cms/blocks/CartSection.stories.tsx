import type { Meta, StoryObj } from "@storybook/react";
import CartSection from "./CartSection";

const meta: Meta<typeof CartSection> = {
  component: CartSection,
  args: {
    showPromo: true,
    showGiftCard: true,
    showLoyalty: false,
  },
};
export default meta;

export const Default: StoryObj<typeof CartSection> = {};

