import type {
  ProductImportReport,
  ProductImportReportItem,
} from "@acme/platform-core/types/productImport";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/shadcn";

function normalizeStatus(item: ProductImportReportItem): string {
  if (item.status) return item.status;
  if (item.errors && item.errors.length) return "error";
  if (item.warnings && item.warnings.length) return "warning";
  return "ok";
}

function summarizeNotes(item: ProductImportReportItem): string {
  const notes = [...(item.errors ?? []), ...(item.warnings ?? [])];
  if (notes.length) return notes.join("; ");
  return item.message ?? "";
}

export default function ProductImportResults({
  report,
}: {
  report: ProductImportReport;
}) {
  const items = report.items ?? [];
  const created = report.created ?? items.filter((item) => item.status === "created").length;
  const updated = report.updated ?? items.filter((item) => item.status === "updated").length;
  const skipped = report.skipped ?? items.filter((item) => item.status === "skipped").length;
  const errors = report.errors ?? items.filter((item) => normalizeStatus(item) === "error").length;

  return (
    <div className="space-y-4 rounded-2xl border border-border/10 bg-surface-1 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">
            {report.dryRun ? "Preview report" : "Import report"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Review parsed items, counts, and any errors before committing.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{created}</span> created |{" "}
          <span className="font-medium text-foreground">{updated}</span> updated |{" "}
          <span className="font-medium text-foreground">{skipped}</span> skipped |{" "}
          <span className="font-medium text-foreground">{errors}</span> errors
        </div>
      </div>

      {items.length ? (
        <div className="overflow-hidden rounded-2xl border border-border/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.sku}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{item.sku}</div>
                      {item.title ? (
                        <div className="text-xs text-muted-foreground">{item.title}</div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {normalizeStatus(item)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {summarizeNotes(item) || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No item details available.</p>
      )}
    </div>
  );
}
