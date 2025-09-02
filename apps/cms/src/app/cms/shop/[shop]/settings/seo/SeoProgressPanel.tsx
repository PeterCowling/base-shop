import { formatTimestamp } from "@acme/date-utils";
import type { AnalyticsEvent } from "@acme/types";
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

  return (
    <div className="space-y-4 text-sm">
      {audits.length === 0 ? (
        <p className="text-muted-foreground">No SEO data available.</p>
      ) : (
        <SeoChart labels={labels} scores={scores} />
      )}
      {recs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Latest Recommendations</h4>
          <ul className="list-disc pl-5 space-y-1">
            {recs.map((r: string) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {auditEvents.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Recent Audits</h4>
          <table className="min-w-full text-left">
            <thead>
              <tr>
                <th className="pr-2">Time</th>
                <th className="pr-2">Score</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map((e) => (
                <tr key={e.timestamp}>
                  <td className="pr-2">{formatTimestamp(e.timestamp)}</td>
                  <td className="pr-2">
                    {typeof e.score === "number" ? e.score : "–"}
                  </td>
                  <td>{e.success === false ? "failed" : "ok"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
