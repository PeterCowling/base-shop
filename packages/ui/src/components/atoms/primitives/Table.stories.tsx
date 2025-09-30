import type { ReactNode } from "react";
import { type Meta, type StoryObj } from "@storybook/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Stack } from "./Stack";

type TableStoryArgs = React.ComponentProps<typeof Table> & {
  columns: string[];
  rows: { cells: ReactNode[]; state?: "selected" }[];
  caption?: string;
};

const renderTable = ({ columns, rows, caption }: TableStoryArgs) => (
  <Stack gap={3}>
    <Table>
      {caption ? (
        <caption className="text-left text-sm text-muted-foreground">{caption}</caption>
      ) : null}
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ cells, state }, index) => (
          <TableRow key={cells.join("-") || index} data-state={state}>
            {cells.map((cell, cellIndex) => (
              <TableCell key={`${index}-${cellIndex}`}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <p className="text-sm text-muted-foreground">
      Hover rows to see surface-2; selected row uses surface-3.
    </p>
  </Stack>
);

const meta = {
  title: "Primitives/Table",
  component: Table,
  subcomponents: {
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Table>;
export default meta;

type Story = StoryObj<typeof meta>;

const hoverVsSelectedArgs: TableStoryArgs = {
  columns: ["Product", "Price"],
  rows: [
    { cells: ["Widget A", "$10"] },
    { cells: ["Widget B (selected)", "$20"], state: "selected" },
    { cells: ["Widget C", "$30"] },
  ],
  caption: "Recent purchases",
};

export const HoverVsSelected: Story = {
  args: hoverVsSelectedArgs,
  render: (args) => renderTable(args as TableStoryArgs),
};
