import { formatTimestamp } from "@acme/date-utils";
import { listEvents } from "@platform-core/repositories/analytics.server";

interface Props {
  shop: string;
}

export default async function AiFeedPanel({ shop }: Props) {
  const events = (await listEvents(shop))
    .filter((e) => e.type === "ai_crawl")
    .slice(-10)
    .reverse();
  if (events.length === 0)
    return (
      <p className="text-muted-foreground text-sm">No AI activity.</p>
    );
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm">
      {events.map((e) => (
        <li key={e.timestamp}>
          {formatTimestamp(e.timestamp!)} – {(e as any).status || "ok"}
        </li>
      ))}
    </ul>
  );
}
