import { type Meta, type StoryObj } from "@storybook/react";
import { Chip } from "./Chip";

const meta: Meta<typeof Chip> = {
  component: Chip,
  args: {
    children: "Chip",
  },
};
export default meta;

export const Default: StoryObj<typeof Chip> = {};
