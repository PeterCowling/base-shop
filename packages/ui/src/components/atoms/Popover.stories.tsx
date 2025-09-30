import { type Meta, type StoryObj } from "@storybook/react";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Button } from "./primitives/button";

const meta = {
  title: "Atoms/Popover",
  component: Popover,
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>;
export default meta;

type Story = StoryObj<typeof meta>;


export const PanelSurface = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="text-sm">Token-driven panel surface</div>
      </PopoverContent>
    </Popover>
  ),
} satisfies Story;
