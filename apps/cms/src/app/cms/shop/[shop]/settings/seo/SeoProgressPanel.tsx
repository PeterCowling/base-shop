import { formatTimestamp } from "@acme/date-utils";
import type { AnalyticsEvent } from "@acme/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
} from "@/components/atoms/shadcn";
import {
  readSeoAudits,
  type SeoAuditEntry,
} from "@platform-core/repositories/seoAudit.server";
import { listEvents } from "@platform-core/repositories/analytics.server";
import { SeoChart } from "./SeoChart.client";

interface Props {
  /** Shop identifier */
  shop: string;
}

interface AuditCompleteEvent extends AnalyticsEvent {
  timestamp: string;
  score?: number;
  success?: boolean;
}

export default async function SeoProgressPanel({ shop }: Props) {
  const [audits, events] = (await Promise.all([
    readSeoAudits(shop),
    listEvents(shop) as Promise<AnalyticsEvent[]>,
  ])) as [SeoAuditEntry[], AnalyticsEvent[]];

  const auditEvents = events
    .filter(
      (e: AnalyticsEvent): e is AuditCompleteEvent =>
        e.type === "audit_complete",
    )
    .slice(-5)
    .reverse();

  const labels = audits.map((a: SeoAuditEntry) => formatTimestamp(a.timestamp));
  const scores = audits.map((a: SeoAuditEntry) => a.score);
  const recs: string[] = audits.at(-1)?.recommendations ?? [];
  const latestScore = audits.at(-1)?.score;
  const averageScore = audits.length
    ? Math.round(scores.reduce((total, val) => total + val, 0) / audits.length)
    : undefined;

  return (
    <Card>
      <CardContent className="space-y-6 p-6 text-sm">
        <div>
          <h3 className="text-lg font-semibold">SEO Progress</h3>
          <p className="text-muted-foreground text-sm">
            Visualize audit scores over time and track recent crawl outcomes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-border/10 p-4">
            <p className="text-xs text-muted-foreground">Latest score</p>
            <p className="text-base font-semibold">{latestScore ?? "–"}</p>
          </div>
          <div className="rounded-md border border-border/10 p-4">
            <p className="text-xs text-muted-foreground">Average score</p>
            <p className="text-base font-semibold">{averageScore ?? "–"}</p>
          </div>
          <div className="rounded-md border border-border/10 p-4">
            <p className="text-xs text-muted-foreground">Audit count</p>
            <p className="text-base font-semibold">{audits.length}</p>
          </div>
        </div>

        {audits.length === 0 ? (
          <p className="text-muted-foreground">No SEO data available.</p>
        ) : (
          <SeoChart labels={labels} scores={scores} />
        )}

        {recs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Latest recommendations</h4>
            <ul className="list-disc pl-5 space-y-1">
              {recs.map((r: string) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {auditEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recent audits</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEvents.map((e) => (
                  <TableRow key={e.timestamp}>
                    <TableCell>{formatTimestamp(e.timestamp)}</TableCell>
                    <TableCell>
                      {typeof e.score === "number" ? e.score : "–"}
                    </TableCell>
                    <TableCell>{e.success === false ? "failed" : "ok"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
