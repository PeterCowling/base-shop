import { type Meta, type StoryObj } from "@storybook/react";
import { Logo } from "./Logo";

const meta: Meta<typeof Logo> = {
  component: Logo,
  args: {
    shopName: "Logo",
  },
};
export default meta;

export const Default: StoryObj<typeof Logo> = {};
