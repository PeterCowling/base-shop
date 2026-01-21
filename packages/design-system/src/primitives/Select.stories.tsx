import type { Meta, StoryObj } from "@storybook/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta: Meta = {
  title: "Atoms/Primitives/Select",
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Select defaultValue="apple">
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Choose option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  ),
};
