import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "Atoms/Primitives/Input",
  component: Input,
  args: {
    placeholder: "Enter text",
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithLongValue: Story = {
  args: {
    defaultValue: "averyverylongunbrokensequencewithoutspaces@example.com",
  },
};
