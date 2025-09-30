import type { Meta, StoryObj } from "@storybook/react";
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

const meta = {
  component: DataTable,
  args: {
    rows: sampleRows,
    columns: sampleColumns,
    selectable: false,
  },
  argTypes: {
    rows: { control: "object" },
    columns: { control: "object" },
    selectable: { control: "boolean" },
    onSelectionChange: { action: "selectionChange" },
  },
} satisfies Meta<typeof DataTable<Row>>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
