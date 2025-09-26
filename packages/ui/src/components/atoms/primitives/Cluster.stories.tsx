import type { Meta, StoryObj } from "@storybook/react";
import { Cluster } from "./Cluster";

const meta: Meta<typeof Cluster> = {
  title: "Primitives/Cluster",
  component: Cluster,
};
export default meta;

type Story = StoryObj<typeof Cluster>;

export const Basic: Story = {
  args: { gap: 2, className: "p-4 border rounded" },
  render: (args) => (
    <Cluster {...args}>
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="bg-muted px-2 py-1 rounded">Tag {i + 1}</span>
      ))}
    </Cluster>
  ),
};

