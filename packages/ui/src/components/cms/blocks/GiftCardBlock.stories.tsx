import type { Meta, StoryObj } from "@storybook/react";
import GiftCardBlock from "./GiftCardBlock";

const meta = {
  title: "CMS/Blocks/GiftCardBlock",
  component: GiftCardBlock,
  tags: ["autodocs"],
} satisfies Meta<typeof GiftCardBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  args: {
    denominations: [25, 50, 100],
    description: "Give the gift of choice.",
  },
} satisfies Story;
