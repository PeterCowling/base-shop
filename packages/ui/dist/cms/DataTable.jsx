"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../ui/table";
export default function DataTable({ rows, columns, }) {
    return (<Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (<TableHead key={col.header} style={{ width: col.width }}>
              {col.header}
            </TableHead>))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row, i) => (<TableRow key={i}>
            {columns.map((col) => (<TableCell key={col.header}>{col.render(row)}</TableCell>))}
          </TableRow>))}
      </TableBody>
    </Table>);
}
