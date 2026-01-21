import type { Meta, StoryObj } from "@storybook/react";

import { SelectField } from "./SelectField";

const meta: Meta<typeof SelectField> = {
  title: "Atoms/SelectField",
  component: SelectField,
  args: {
    label: "Country",
    placeholder: "Choose a country",
    options: [
      { value: "us", label: "United States" },
      { value: "uk", label: "United Kingdom" },
      { value: "it", label: "Italy" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof SelectField>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    error: "Selection required",
    required: true,
  },
};
