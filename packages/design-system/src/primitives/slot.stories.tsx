import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./button";
import { Slot } from "./slot";

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
