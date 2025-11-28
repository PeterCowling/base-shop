import { type Meta, type StoryObj } from "@storybook/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

const meta: Meta<typeof Select> = {
  title: "Atoms/Shadcn/Select",
  component: Select,
  tags: ["autodocs"],
  args: {},
};
export default meta;

export const Default: StoryObj<typeof Select> = {
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
};
