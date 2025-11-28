import type { Meta, StoryObj } from "@storybook/nextjs";
import GiftCardBlock from "./GiftCardBlock";

const meta: Meta<typeof GiftCardBlock> = {
  title: "CMS/Blocks/GiftCardBlock",
  component: GiftCardBlock,
  tags: ["autodocs"],
};
export default meta;

export const Default: StoryObj<typeof GiftCardBlock> = {
  args: {
    denominations: [25, 50, 100],
    description: "Give the gift of choice.",
  },
};
