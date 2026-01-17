import type { ProductImportEvent } from "@acme/platform-core/types/productImport";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/shadcn";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentProductImports({
  events,
}: {
  events: ProductImportEvent[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Recent imports</h3>
      {events.length ? (
        <div className="overflow-hidden rounded-2xl border border-border/10 bg-surface-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Imported</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-44">Created/Updated</TableHead>
                <TableHead className="w-28">Errors</TableHead>
                <TableHead className="w-28">Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(event.receivedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.note || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.report.created ?? 0}/{event.report.updated ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.report.errors ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.items.length}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No imports yet.</p>
      )}
    </div>
  );
}
