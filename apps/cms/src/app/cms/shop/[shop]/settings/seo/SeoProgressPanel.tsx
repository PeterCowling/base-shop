import { formatTimestamp } from "@acme/date-utils";
import { readSeoAudits } from "@platform-core/repositories/seoAudit.server";
import { SeoChart } from "./SeoChart.client";

interface Props {
  /** Shop identifier */
  shop: string;
}

export default async function SeoProgressPanel({ shop }: Props) {
  const audits = await readSeoAudits(shop);

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
    </div>
  );
}
