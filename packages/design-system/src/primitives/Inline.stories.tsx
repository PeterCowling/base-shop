import type { Meta, StoryObj } from "@storybook/nextjs";

import { Inline } from "./Inline";

const meta: Meta<typeof Inline> = {
  title: "Primitives/Inline",
  component: Inline,
};
export default meta;

type Story = StoryObj<typeof Inline>;

export const Basic: Story = {
  args: { gap: 2, className: "p-4 border rounded" },
  render: (args) => (
    <Inline {...args}>
      <div className="bg-muted p-2">One</div>
      <div className="bg-muted p-2">Two</div>
      <div className="bg-muted p-2">Three</div>
    </Inline>
  ),
};


export const Default: StoryObj<typeof Inline> = {};
