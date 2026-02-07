import type { Meta, StoryObj } from "@storybook/react";

import { Progress } from "./Progress";

const meta: Meta<typeof Progress> = {
  title: "Atoms/Progress",
  component: Progress,
  args: {
    value: 64,
    label: "64% complete",
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {};

export const WithZeroValue: Story = {
  args: {
    value: 0,
    label: "Not started",
  },
};

export const WithOverflowValue: Story = {
  args: {
    value: 140,
    label: "Clamped at 100%",
  },
};
