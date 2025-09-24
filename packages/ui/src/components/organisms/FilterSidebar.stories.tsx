"use client";
import { type Meta, type StoryObj } from "@storybook/react";
import { FilterSidebar } from "./FilterSidebar.client";

const meta: Meta<typeof FilterSidebar> = {
  title: "Organisms/FilterSidebar",
  component: FilterSidebar,
};
export default meta;

export const Default: StoryObj<typeof FilterSidebar> = {
  render: () => (
    <div className="p-8">
      <FilterSidebar onChange={() => {}} />
    </div>
  ),
};

