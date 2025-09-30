import { type Meta, type StoryObj } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

const meta = {
  title: "Atoms/Shadcn/Select",
  component: Select,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Select>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="one">One</SelectItem>
        <SelectItem value="two">Two</SelectItem>
      </SelectContent>
    </Select>
  ),
} satisfies Story;
