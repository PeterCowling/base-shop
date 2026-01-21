import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { FilterBar, type FilterDefinition,type Filters } from "./index";

const definitions: FilterDefinition[] = [
  { name: "category", label: "Category", type: "select", options: ["Shoes", "Shirts", "Accessories"] },
  { name: "price", label: "Max price", type: "number" },
];

const meta: Meta<typeof FilterBar> = {
  title: "Platform/Shop/FilterBar",
  component: FilterBar,
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

function ControlledTemplate(args: React.ComponentProps<typeof FilterBar>) {
  const [filters, setFilters] = useState<Filters>({ category: "Shoes", price: 100 });
  return (
    <div className="space-y-2">
      <FilterBar
        {...args}
        definitions={definitions}
        values={filters}
        onChange={(next) => setFilters(next)}
      />
      <pre className="text-xs rounded border border-border bg-muted/60 p-2 text-foreground">
        {JSON.stringify(filters, null, 2)}
      </pre>
    </div>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledTemplate {...args} />,
};

export const Uncontrolled: Story = {
  args: {
    definitions,
    onChange: () => {},
  },
};
