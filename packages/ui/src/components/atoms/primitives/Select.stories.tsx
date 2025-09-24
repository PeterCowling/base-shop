import { type Meta, type StoryObj } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta: Meta<typeof Select> = {
  title: "Primitives/Select",
  component: Select,
};
export default meta;

export const PanelSurface: StoryObj<typeof Select> = {
  render: () => (
    <div className="p-8">
      <Select>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Choose a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="grapes">Grapes</SelectItem>
            <SelectSeparator />
            <SelectItem value="kiwi">Kiwi</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

