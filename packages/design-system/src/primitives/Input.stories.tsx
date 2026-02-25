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

export const ShapeDepths: Story = {
  render: (args) => (
    <div className="grid max-w-xl gap-3">
      <Input {...args} shape="square" placeholder="Square input" />
      <Input {...args} shape="soft" placeholder="Soft input" />
      <Input {...args} shape="pill" placeholder="Pill input" />
    </div>
  ),
};

export const DensityScale: Story = {
  render: (args) => (
    <div className="grid max-w-xl gap-3">
      <Input {...args} density="comfortable" placeholder="Comfortable input" />
      <Input {...args} density="compact" placeholder="Compact input" />
    </div>
  ),
};
