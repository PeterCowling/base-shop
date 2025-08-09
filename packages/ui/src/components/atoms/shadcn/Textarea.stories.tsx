import { type Meta, type StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Atoms/Shadcn/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { placeholder: "Enter text" },
};
export default meta;

export const Default: StoryObj<typeof Textarea> = {};
