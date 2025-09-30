import { type Meta, type StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

const meta = {
  title: "Atoms/Shadcn/Table",
  component: Table,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Table>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead>Header</TableHead>
          <TableHead>Header</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Cell</TableCell>
          <TableCell>Cell</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
} satisfies Story;
