import type { Meta, StoryObj } from "@storybook/react";

import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "Atoms/Primitives/Textarea",
  component: Textarea,
  args: {
    placeholder: "Enter detailed notes",
    rows: 4,
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithLongUnbroken: Story = {
  args: {
    defaultValue:
      "supercalifragilisticexpialidocioussupercalifragilisticexpialidociouswithoutspaces",
  },
};

export const ShapeDepths: Story = {
  render: (args) => (
    <div className="grid max-w-xl gap-3">
      <Textarea {...args} shape="square" placeholder="Square textarea" />
      <Textarea {...args} shape="soft" placeholder="Soft textarea" />
      <Textarea {...args} shape="pill" placeholder="Pill textarea" />
    </div>
  ),
};

export const DensityScale: Story = {
  render: (args) => (
    <div className="grid max-w-xl gap-3">
      <Textarea {...args} density="comfortable" placeholder="Comfortable textarea" />
      <Textarea {...args} density="compact" placeholder="Compact textarea" />
    </div>
  ),
};
