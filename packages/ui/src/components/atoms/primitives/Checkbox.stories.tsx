import { type Meta, type StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";

const meta = {
  component: Checkbox,
  args: {
    defaultChecked: false,
  },
  argTypes: {
    defaultChecked: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
