import { type Meta, type StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  component: Input,
  args: {
    label: "Email",
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

export const Default: StoryObj<typeof Input> = {};
