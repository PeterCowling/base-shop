"use client";
import { type Meta, type StoryObj } from "@storybook/react";
import { FilterSidebar } from "./FilterSidebar.client";

const meta = {
  title: "Organisms/FilterSidebar",
  component: FilterSidebar,
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FilterSidebar>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  render: () => <FilterSidebar onChange={() => {}} />,
} satisfies Story;
