import type { Meta, StoryObj } from "@storybook/nextjs";

import { Sidebar } from "./Sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Primitives/Sidebar",
  component: Sidebar,
};
export default meta;

type Story = StoryObj<typeof Sidebar>;

export const Basic: Story = {
  args: { sideWidth: "w-64", className: "p-4 border rounded" },
  render: (args) => (
    <Sidebar {...args}>
      <div className="bg-muted p-2">Sidebar</div>
      <div className="bg-muted p-2">Main content goes here.</div>
    </Sidebar>
  ),
};


export const Default: StoryObj<typeof Sidebar> = {};
