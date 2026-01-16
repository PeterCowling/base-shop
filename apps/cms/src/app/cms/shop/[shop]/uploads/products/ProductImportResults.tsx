/* eslint-disable ds/no-arbitrary-tailwind -- COM-0001 [ttl=2026-12-31] layout tokens pending DS refactor */

import type { ProductImportReport } from "@platform-core/types/productImport";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/shadcn";

export default function ProductImportResults({
  report,
}: {
  report: ProductImportReport;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/10 bg-surface-1 p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</p>
            <p className="mt-1 text-sm text-foreground">{report.created}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Updated</p>
            <p className="mt-1 text-sm text-foreground">{report.updated}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skipped</p>
            <p className="mt-1 text-sm text-foreground">{report.skipped}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Errors</p>
            <p className="mt-1 text-sm text-foreground">{report.errors}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/10 bg-surface-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[72px]">Row</TableHead>
              <TableHead className="w-[120px]">Action</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.results.map((r) => (
              <TableRow key={`${r.row}-${r.action}-${r.sku ?? ""}-${r.id ?? ""}`}>
                <TableCell>{r.row}</TableCell>
                <TableCell>{r.action}</TableCell>
                <TableCell className="font-mono text-xs">{r.sku ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{r.id ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.message ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
