import { type Meta, type StoryObj } from "@storybook/react";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Button } from "./primitives/button";

const meta: Meta<typeof Popover> = {
  title: "Atoms/Popover",
  component: Popover,
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const PanelSurface: StoryObj<typeof Popover> = {
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
};
