import type { Meta, StoryObj } from "@storybook/react";
import { Inline } from "./Inline";

const meta = {
  title: "Primitives/Inline",
  component: Inline,
} satisfies Meta<typeof Inline>;
export default meta;

type Story = StoryObj<typeof meta>;



export const Basic = {
  args: { gap: 2, className: "p-4 border rounded" },
  render: (args) => (
    <Inline {...args}>
      <div className="bg-muted p-2">One</div>
      <div className="bg-muted p-2">Two</div>
      <div className="bg-muted p-2">Three</div>
    </Inline>
  ),
} satisfies Story;

