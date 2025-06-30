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

export const WithError: StoryObj<typeof Input> = {
  args: { error: "Invalid email" },
};

export const Disabled: StoryObj<typeof Input> = {
  args: { disabled: true },
};

export const FloatingLabel: StoryObj<typeof Input> = {
  args: { floatingLabel: true, label: "Email" },
};
