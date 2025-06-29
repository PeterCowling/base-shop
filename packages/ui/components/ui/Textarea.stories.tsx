import { type Meta, type StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  args: {
    label: "Message",
    error: "",
    floatingLabel: false,
  },
  argTypes: {
    label: { control: "text" },
    error: { control: "text" },
    floatingLabel: { control: "boolean" },
  },
};
export default meta;

export const Default: StoryObj<typeof Textarea> = {};
