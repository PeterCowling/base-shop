import { type Meta, type StoryObj } from "@storybook/nextjs";

import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Atoms/Shadcn/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: { checked: { control: "boolean" } },
  args: { checked: false },
};
export default meta;

export const Default: StoryObj<typeof Checkbox> = {};
