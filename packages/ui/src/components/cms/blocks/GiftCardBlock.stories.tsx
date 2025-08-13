import type { Meta, StoryObj } from "@storybook/react";
import GiftCardBlock from "./GiftCardBlock";

const meta: Meta<typeof GiftCardBlock> = {
  component: GiftCardBlock,
  args: {
    description: "Choose an amount",
    amounts: [25, 50, 100],
    ctaLabel: "Buy",
    ctaHref: "/gift-card",
  },
};
export default meta;

export const Default: StoryObj<typeof GiftCardBlock> = {};
