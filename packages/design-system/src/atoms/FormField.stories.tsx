import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "../primitives/input";

import { FormField } from "./FormField";

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
