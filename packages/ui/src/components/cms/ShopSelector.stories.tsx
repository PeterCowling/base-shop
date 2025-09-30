import type { Meta, StoryObj } from "@storybook/react";
import ShopSelector from "./ShopSelector";

const meta = {
  title: "CMS/ShopSelector",
  component: ShopSelector,
  tags: ["autodocs"],
} satisfies Meta<typeof ShopSelector>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
