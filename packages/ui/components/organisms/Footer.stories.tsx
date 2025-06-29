import { type Meta, type StoryObj } from "@storybook/react";
import { Footer } from "./Footer";

const meta: Meta<typeof Footer> = {
  component: Footer,
  args: {
    children: "Footer content",
  },
};
export default meta;

export const Default: StoryObj<typeof Footer> = {};
