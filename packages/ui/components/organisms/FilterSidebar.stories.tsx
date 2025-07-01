import { type Meta, type StoryObj } from "@storybook/react";
import { FilterSidebar } from "./FilterSidebar";

const meta: Meta<typeof FilterSidebar> = {
  component: FilterSidebar,
  args: {},
  argTypes: {
    onChange: { action: "onChange" },
    width: {
      control: { type: "text" },
      description: "Tailwind width class or pixel value",
    },
  },
};
export default meta;

export const Default: StoryObj<typeof FilterSidebar> = {};
