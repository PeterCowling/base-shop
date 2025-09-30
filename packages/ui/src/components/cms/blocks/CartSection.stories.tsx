import type { Meta, StoryObj } from "@storybook/react";
import CartSection from "./CartSection";

const meta = {
  component: CartSection,
  args: {
    showPromo: true,
    showGiftCard: true,
    showLoyalty: false,
  },
} satisfies Meta<typeof CartSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

