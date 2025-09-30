import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import DataTable, { type Column } from "./DataTable";

interface Row {
  name: string;
  age: number;
}

const sampleRows: Row[] = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
];

const sampleColumns: Column<Row>[] = [
  { header: "Name", render: (r) => r.name },
  { header: "Age", render: (r) => r.age },
];

const meta: Meta<typeof DataTable<Row>> = {
  component: DataTable,
  args: {
    rows: sampleRows,
    columns: sampleColumns,
    selectable: false,
    onSelectionChange: fn(),
  },
  argTypes: {
    rows: { control: "object" },
    columns: { control: "object" },
    selectable: { control: "boolean" },
  },
};
export default meta;

export const Default: StoryObj<typeof DataTable<Row>> = {};
