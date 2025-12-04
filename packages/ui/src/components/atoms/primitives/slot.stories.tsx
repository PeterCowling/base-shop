import type { Meta, StoryObj } from "@storybook/react";
import { Slot } from "./slot";
import { Button } from "./button";

const meta: Meta<typeof Slot> = {
  title: "Atoms/Primitives/Slot",
  component: Slot,
};

export default meta;
type Story = StoryObj<typeof Slot>;

export const Default: Story = {
  render: () => (
    <Slot className="text-primary">
      <Button>Slotted Button</Button>
    </Slot>
  ),
};
