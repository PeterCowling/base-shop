import type { Meta, StoryObj } from "@storybook/nextjs";

import CartSection from "./CartSection";

const meta: Meta<typeof CartSection> = {
  title: "CMS Blocks/CartSection",
  component: CartSection,
  args: {
    showPromo: true,
    showGiftCard: true,
    showLoyalty: false,
  },
};
export default meta;

export const Default: StoryObj<typeof CartSection> = {};

