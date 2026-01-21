import type { Meta, StoryObj } from "@storybook/nextjs";

import ValueProps from "./ValueProps";

const meta: Meta<typeof ValueProps> = {
  title: "CMS/Blocks/ValueProps",
  component: ValueProps,
  tags: ["autodocs"],
};
export default meta;

export const Default: StoryObj<typeof ValueProps> = {};
