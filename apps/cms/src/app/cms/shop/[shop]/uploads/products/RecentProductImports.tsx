/* eslint-disable ds/no-arbitrary-tailwind -- COM-0001 [ttl=2026-12-31] layout tokens pending DS refactor */

import type { ProductImportEvent } from "@platform-core/types/productImport";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/shadcn";

export default function RecentProductImports({
  events,
}: {
  events: ProductImportEvent[];
}) {
  if (events.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Recent imports</h3>
      <div className="overflow-hidden rounded-2xl border border-border/10 bg-surface-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imported at</TableHead>
              <TableHead className="w-[96px]">Created</TableHead>
              <TableHead className="w-[96px]">Updated</TableHead>
              <TableHead className="w-[96px]">Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.slice(0, 5).map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(e.importedAt).toLocaleString("en-GB")}
                </TableCell>
                <TableCell>{e.report.created}</TableCell>
                <TableCell>{e.report.updated}</TableCell>
                <TableCell>{e.report.errors}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
