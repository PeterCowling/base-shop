import { type Meta, type StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const meta: Meta<typeof Table> = {
  component: Table,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof Table> = {
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead>Column A</TableHead>
          <TableHead>Column B</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Foo</TableCell>
          <TableCell>Bar</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
