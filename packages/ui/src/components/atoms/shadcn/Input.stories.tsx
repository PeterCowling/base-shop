import { type Meta, type StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta = {
  title: "Atoms/Shadcn/Input",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "Enter text" },
} satisfies Meta<typeof Input>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
