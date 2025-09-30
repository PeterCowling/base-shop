import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./Sidebar";

const meta = {
  title: "Primitives/Sidebar",
  component: Sidebar,
} satisfies Meta<typeof Sidebar>;
export default meta;

type Story = StoryObj<typeof meta>;



export const Basic = {
  args: { sideWidth: "w-64", className: "p-4 border rounded" },
  render: (args) => (
    <Sidebar {...args}>
      <div className="bg-muted p-2">Sidebar</div>
      <div className="bg-muted p-2">Main content goes here.</div>
    </Sidebar>
  ),
} satisfies Story;

