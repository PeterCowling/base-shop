import { type Meta, type StoryObj } from "@storybook/nextjs";
import ValueProps from "./ValueProps";

const meta: Meta<typeof ValueProps> = {
  title: "Home/ValueProps",
  component: ValueProps,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof ValueProps> = {};
