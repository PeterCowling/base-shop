import { formatTimestamp } from "@acme/date-utils";
import { listEvents } from "@platform-core/repositories/analytics.server";

interface Props {
  shop: string;
}

export default async function AiFeedPanel({ shop }: Props) {
  const events = await listEvents(shop);
  const crawls = events
    .filter((e) => e.type === "ai_crawl")
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-4 text-sm">
      <h3 className="text-lg font-medium">AI Feed Crawls</h3>
      {crawls.length === 0 ? (
        <p className="text-muted-foreground">No crawl activity.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-1">Date</th>
              <th className="py-1">Items</th>
              <th className="py-1">Page</th>
            </tr>
          </thead>
          <tbody>
            {crawls.map((c) => (
              <tr key={c.timestamp as string} className="border-t">
                <td className="font-mono py-1">{formatTimestamp(c.timestamp as string)}</td>
                <td className="py-1">{c.items as number}</td>
                <td className="py-1">{c.page as number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

