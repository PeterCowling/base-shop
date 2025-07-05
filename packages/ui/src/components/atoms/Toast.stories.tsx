import { type Meta, type StoryObj } from "@storybook/react";
import { Toast } from "./Toast";

const meta: Meta<typeof Toast> = {
  component: Toast,
  args: {
    open: true,
    message: "Hello",
  },
};
export default meta;

export const Default: StoryObj<typeof Toast> = {};
