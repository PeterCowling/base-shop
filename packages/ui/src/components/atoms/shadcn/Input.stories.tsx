import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Atoms/Shadcn/Input",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "Enter text" },
};
export default meta;

export const Default: StoryObj<typeof Input> = {};
