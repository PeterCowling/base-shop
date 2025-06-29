import type { Meta, StoryObj } from "@storybook/react";
import ShopSelector from "./ShopSelector";

const meta: Meta<typeof ShopSelector> = {
  title: "CMS/ShopSelector",
  component: ShopSelector,
  tags: ["autodocs"],
};
export default meta;

export const Default: StoryObj<typeof ShopSelector> = {};
