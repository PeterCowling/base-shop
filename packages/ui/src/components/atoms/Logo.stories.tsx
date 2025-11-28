import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Logo } from "./Logo";

const meta: Meta<typeof Logo> = {
  component: Logo,
  args: {
    fallbackText: "Logo",
  },
};
export default meta;

export const Default: StoryObj<typeof Logo> = {};
