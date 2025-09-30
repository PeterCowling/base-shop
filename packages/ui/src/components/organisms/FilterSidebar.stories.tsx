"use client";
import { type Meta, type StoryObj } from "@storybook/react";
import { FilterSidebar } from "./FilterSidebar.client";

const meta: Meta<typeof FilterSidebar> = {
  title: "Organisms/FilterSidebar",
  component: FilterSidebar,
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const Default: StoryObj<typeof FilterSidebar> = {
  render: () => <FilterSidebar onChange={() => {}} />,
};
