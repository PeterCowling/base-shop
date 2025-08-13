import type { Meta, StoryObj } from "@storybook/react";
import GiftCardBlock from "./GiftCardBlock";

const meta: Meta<typeof GiftCardBlock> = {
  component: GiftCardBlock,
  args: {
    amounts: [25, 50, 100],
    description: "Choose a gift card amount",
  },
};

export default meta;

export const Default: StoryObj<typeof GiftCardBlock> = {};

