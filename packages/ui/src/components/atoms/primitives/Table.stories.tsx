import { type Meta, type StoryObj } from "@storybook/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Stack } from "./Stack";

const meta: Meta<typeof Table> = {
  title: "Primitives/Table",
  component: Table,
};
export default meta;

export const HoverVsSelected: StoryObj<typeof Table> = {
  render: () => (
    <div className="p-8">
      <Stack gap={3}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Widget A</TableCell>
              <TableCell>$10</TableCell>
            </TableRow>
            <TableRow data-state="selected">
              <TableCell>Widget B (selected)</TableCell>
              <TableCell>$20</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Widget C</TableCell>
              <TableCell>$30</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground">Hover rows to see surface-2; selected row uses surface-3.</p>
      </Stack>
    </div>
  ),
};
