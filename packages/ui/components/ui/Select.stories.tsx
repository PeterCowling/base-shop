import { type Meta, type StoryObj } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta: Meta<typeof Select> = {
  component: Select,
  args: {
    defaultValue: "apple",
  },
  argTypes: {
    defaultValue: { control: "select", options: ["apple", "banana", "orange"] },
  },
};
export default meta;

export const Default: StoryObj<typeof Select> = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  ),
};
