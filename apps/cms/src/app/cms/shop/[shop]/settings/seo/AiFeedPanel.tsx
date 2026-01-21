import { formatTimestamp } from "@acme/date-utils";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { listEvents } from "@acme/platform-core/repositories/analytics.server";

import {
 Button,Card, CardContent,  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from "@/components/atoms/shadcn";

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
  const t = await getTranslations("en");
  const events = (await listEvents()) as EventRecord[];
  const filtered = events
    .filter((e) => e.shop === shop)
    .filter((e) => e.type === "ai_crawl")
    .slice(-5)
    .reverse();

  const latest = filtered[0];
  const lastRun = latest?.timestamp
    ? formatTimestamp(latest.timestamp)
    : (t("No runs yet") as string);
  const queueStatus = describeQueueStatus(latest?.status);

  return (
    <Card>
      <CardContent className="space-y-6 p-6 text-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">{t("AI Feed Activity")}</h3>
            <p className="text-muted-foreground text-sm">
              {t(
                "Track the most recent AI crawl executions and delivery status.",
              )}
            </p>
          </div>
          <div className="shrink-0 text-end">
            <p>
              {t("Last run:")}{" "}
              <span className="font-medium">{lastRun}</span>
            </p>
            <p className="mt-1">
              {t("Queue status:")}{" "}
              <span className="font-medium">{t(queueStatus) as string}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button">{t("Refresh feed")}</Button>
          <Button type="button" variant="outline">
            {t("Download JSON")}
          </Button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground">{t("No AI feed activity yet.")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Time")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
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
