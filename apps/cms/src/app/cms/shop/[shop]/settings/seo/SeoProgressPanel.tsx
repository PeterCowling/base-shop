import { formatTimestamp } from "@acme/date-utils";
import { readSeoAudits } from "@platform-core/repositories/seoAudit.server";
import { listEvents } from "@platform-core/repositories/analytics.server";

interface Props {
  /** Shop identifier */
  shop: string;
}

export default async function SeoProgressPanel({ shop }: Props) {
  const audits = await readSeoAudits(shop);
  const events = await listEvents(shop);

  const trafficByDay: Record<string, number> = {};
  for (const ev of events) {
    if (ev.type === "page_view" && (ev as { source?: string }).source === "organic") {
      const day = (ev.timestamp as string).slice(0, 10);
      trafficByDay[day] = (trafficByDay[day] ?? 0) + 1;
    }
  }

  const rows = audits.map((a) => ({
    timestamp: a.timestamp,
    score: a.score,
    traffic: trafficByDay[a.timestamp.slice(0, 10)] ?? 0,
  }));

  const recs = audits.at(-1)?.recommendations ?? [];

  return (
    <div className="space-y-4 text-sm">
      {rows.length === 0 ? (
        <p className="text-muted-foreground">No SEO data available.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-1">Date</th>
              <th className="py-1">Audit Score</th>
              <th className="py-1">Organic Views</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.timestamp} className="border-t">
                <td className="font-mono py-1">{formatTimestamp(r.timestamp)}</td>
                <td className="py-1">{r.score}</td>
                <td className="py-1">{r.traffic}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </div>
  );
}
