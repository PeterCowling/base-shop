import { type Meta, type StoryObj } from "@storybook/nextjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

const meta: Meta<typeof Table> = {
  title: "Atoms/Shadcn/Table",
  component: Table,
  tags: ["autodocs"],
  args: {},
};
export default meta;

export const Default: StoryObj<typeof Table> = {
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
};
