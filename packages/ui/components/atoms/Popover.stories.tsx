import { type Meta, type StoryObj } from "@storybook/react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

const meta: Meta<typeof Popover> = {
  title: "Atoms/Popover",
  component: Popover,
  parameters: { docs: { layout: "centered" } },
};
export default meta;

const DefaultRender = () => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="border px-2 py-1">Toggle</button>
      </PopoverTrigger>
      <PopoverContent>Content</PopoverContent>
    </Popover>
  );
};

export const Default: StoryObj<typeof Popover> = {
  render: () => <DefaultRender />,
};
