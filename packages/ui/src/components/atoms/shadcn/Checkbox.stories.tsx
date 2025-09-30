import { type Meta, type StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Atoms/Shadcn/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: { checked: { control: "boolean" } },
  args: { checked: false },
} satisfies Meta<typeof Checkbox>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
