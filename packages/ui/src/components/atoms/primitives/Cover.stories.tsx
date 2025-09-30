import type { Meta, StoryObj } from "@storybook/react";
import { Cover } from "./Cover";

const meta = {
  title: "Primitives/Cover",
  component: Cover,
} satisfies Meta<typeof Cover>;
export default meta;

type Story = StoryObj<typeof meta>;



export const Basic = {
  args: { minH: "[60vh]", className: "border rounded" },
  render: (args) => (
    <Cover {...args}>
      <div className="text-center p-8">
        <h2 className="text-xl font-bold">Centered</h2>
        <p className="text-sm text-muted">This is vertically centered using the Cover primitive.</p>
      </div>
    </Cover>
  ),
} satisfies Story;

