import { formatTimestamp } from "@acme/date-utils";
import { readSeoAudits } from "@platform-core/repositories/seoAudit.server";
import { listEvents } from "@platform-core/repositories/analytics.server";
import { SeoChart } from "./SeoChart.client";

interface Props {
  /** Shop identifier */
  shop: string;
}

export default async function SeoProgressPanel({ shop }: Props) {
  const [audits, events] = await Promise.all([
    readSeoAudits(shop),
    listEvents(shop),
  ]);

  const auditEvents = events
    .filter((e) => e.type === "audit_complete")
    .slice(-5)
    .reverse();

  const labels = audits.map((a) => formatTimestamp(a.timestamp));
  const scores = audits.map((a) => a.score);
  const recs = audits.at(-1)?.recommendations ?? [];

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
            {recs.map((r) => (
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
                <tr key={e.timestamp as string}>
                  <td className="pr-2">
                    {formatTimestamp(e.timestamp as string)}
                  </td>
                  <td className="pr-2">{e.score ?? "–"}</td>
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
