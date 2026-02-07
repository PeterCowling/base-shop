import type { Meta, StoryObj } from "@storybook/react";

import { Slider } from "./slider";

const meta = {
  title: "Primitives/Slider",
  component: Slider,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <Slider defaultValue={[50]} max={100} step={1} aria-label="Volume" />
    </div>
  ),
};

export const Range: Story = {
  render: () => (
    <div className="w-64">
      <Slider defaultValue={[25, 75]} max={100} step={1} aria-label="Price range" />
    </div>
  ),
};

export const WithSteps: Story = {
  render: () => (
    <div className="w-64">
      <Slider defaultValue={[50]} max={100} step={10} aria-label="Brightness" />
    </div>
  ),
};
