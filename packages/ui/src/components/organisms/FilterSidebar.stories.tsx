"use client";
import { type Meta, type StoryObj } from "@storybook/nextjs";

import { FilterSidebar } from "./FilterSidebar.client";

const meta: Meta<typeof FilterSidebar> = {
  title: "Organisms/FilterSidebar",
  component: FilterSidebar,
  args: {
    onChange: () => {},
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const Default: StoryObj<typeof FilterSidebar> = {};
