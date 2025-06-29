import { type Meta, type StoryObj } from "@storybook/react";
import { Content } from "./Content";

const meta: Meta<typeof Content> = {
  component: Content,
  args: {
    children: "Main content",
  },
};
export default meta;

export const Default: StoryObj<typeof Content> = {};
