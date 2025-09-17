import { formatTimestamp } from "@acme/date-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/shadcn";
import { Card, CardContent, Button } from "@/components/atoms/shadcn";
import { listEvents } from "@platform-core/repositories/analytics.server";

interface EventRecord {
  shop?: string;
  type?: string;
  timestamp?: string;
  status?: unknown;
}

const describeQueueStatus = (status?: unknown) => {
  const normalized = typeof status === "string" ? status.toLowerCase() : "";
  if (!normalized) return "Idle";
  if (normalized.includes("queue")) return "Queued";
  if (normalized.includes("process") || normalized.includes("running")) {
    return "Processing";
  }
  if (normalized.includes("fail") || normalized.includes("error")) {
    return "Attention";
  }
  return "Complete";
};

export default async function AiFeedPanel({ shop }: { shop: string }) {
  const events = (await listEvents()) as EventRecord[];
  const filtered = events
    .filter((e) => e.shop === shop)
    .filter((e) => e.type === "ai_crawl")
    .slice(-5)
    .reverse();

  const latest = filtered[0];
  const lastRun = latest?.timestamp ? formatTimestamp(latest.timestamp) : "No runs yet";
  const queueStatus = describeQueueStatus(latest?.status);

  return (
    <Card>
      <CardContent className="space-y-6 p-6 text-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">AI Feed Activity</h3>
            <p className="text-muted-foreground text-sm">
              Track the most recent AI crawl executions and delivery status.
            </p>
          </div>
          <div className="text-right">
            <p>
              Last run: <span className="font-medium">{lastRun}</span>
            </p>
            <p className="mt-1">
              Queue status: <span className="font-medium">{queueStatus}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button">Refresh feed</Button>
          <Button type="button" variant="outline">
            Download JSON
          </Button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground">No AI feed activity yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e, idx) => (
                <TableRow key={idx}>
                  <TableCell>{formatTimestamp(e.timestamp as string)}</TableCell>
                  <TableCell>{String(e.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
