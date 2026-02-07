import type { Meta, StoryObj } from "@storybook/react";

import { type Column,DataTable } from "./DataTable";

type Row = { id: string; name: string; email: string; role: string };

const columns: Column<Row>[] = [
  { header: "Name", render: (r) => r.name },
  { header: "Email", render: (r) => r.email, width: "30%" },
  { header: "Role", render: (r) => r.role },
];

const rows: Row[] = [
  { id: "1", name: "Alexandria Montgomery", email: "alexandria.montgomery@example.com", role: "Admin" },
  { id: "2", name: "Juan Li", email: "juan.li@example.com", role: "Editor" },
  { id: "3", name: "Priya Kumar", email: "priya.kumar@example.com", role: "Viewer" },
];

const meta: Meta<typeof DataTable<Row>> = {
  title: "Organisms/DataTable",
  component: DataTable,
  args: {
    rows,
    columns,
  },
};

export default meta;
type Story = StoryObj<typeof DataTable<Row>>;

export const Default: Story = {};

export const Selectable: Story = {
  args: {
    selectable: true,
  },
};
