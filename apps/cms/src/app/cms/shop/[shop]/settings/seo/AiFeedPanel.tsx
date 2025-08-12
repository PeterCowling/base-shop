import { formatTimestamp } from "@acme/date-utils";
import { listEvents } from "@platform-core/repositories/analytics.server";

export default async function AiFeedPanel({ shop }: { shop: string }) {
  const events = (await listEvents(shop))
    .filter((e) => e.type === "ai_crawl")
    .slice(-5)
    .reverse();

  if (events.length === 0) {
    return (
      <div className="space-y-2 text-sm">
        <h4 className="font-medium">Recent AI Feed Requests</h4>
        <p className="text-muted-foreground">No AI feed activity yet.</p>
      </div>
    );
  }

  return (
  <div className="space-y-2 text-sm">
    <h4 className="font-medium">Recent AI Feed Requests</h4>
    <ul className="space-y-1">
      {events.map((e, idx) => (
        <li key={idx}>
          {formatTimestamp(e.timestamp as string)} – {e.status}
        </li>
      ))}
    </ul>
  </div>
  );
}
