import { type Meta, type StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta = {
  title: "Atoms/Shadcn/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { placeholder: "Enter text" },
} satisfies Meta<typeof Textarea>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
