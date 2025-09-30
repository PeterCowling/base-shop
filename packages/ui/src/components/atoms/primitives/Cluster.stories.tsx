import type { Meta, StoryObj } from "@storybook/react";
import { Cluster } from "./Cluster";

const meta = {
  title: "Primitives/Cluster",
  component: Cluster,
} satisfies Meta<typeof Cluster>;
export default meta;

type Story = StoryObj<typeof meta>;



export const Basic = {
  args: { gap: 2, className: "p-4 border rounded" },
  render: (args) => (
    <Cluster {...args}>
      {Array.from({ length: 8 }, (_, i) => `tag-${i + 1}`).map((tag) => (
        <span key={tag} className="bg-muted px-2 py-1 rounded">{tag.replace("-", " ")}</span>
      ))}
    </Cluster>
  ),
} satisfies Story;
