import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { FormField } from "./FormField";
import { Input } from "./primitives/input";

const meta: Meta<typeof FormField> = {
  title: "Atoms/FormField",
  component: FormField,
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: "Email address",
    description: "We will never share your email.",
    required: true,
    input: <Input type="email" placeholder="you@example.com" />,
  },
};

export const WithError: Story = {
  args: {
    label: "Username",
    error: "Username already taken",
    input: <Input type="text" defaultValue="longusername" />,
  },
};
