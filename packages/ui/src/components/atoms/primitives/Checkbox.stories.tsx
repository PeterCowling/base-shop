import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Checkbox } from "./checkbox";

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  args: {
    defaultChecked: false,
  },
  argTypes: {
    defaultChecked: { control: "boolean" },
  },
};
export default meta;

export const Default: StoryObj<typeof Checkbox> = {};
