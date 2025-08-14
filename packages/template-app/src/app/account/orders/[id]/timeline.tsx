import { listEvents } from "@platform-core/repositories/reverseLogisticsEvents.server";
import shop from "../../../../../shop.json";

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  cleaned: "Cleaned",
  qaPassed: "QA Passed",
  available: "Available",
};

export default async function OrderTimeline({
  params,
}: {
  params: { id: string };
}) {
  const events = await listEvents(shop.id);
  const orderEvents = events
    .filter((e) => e.sessionId === params.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-xl font-bold">Order Timeline</h1>
      <ol className="border-l border-gray-200 pl-4">
        {orderEvents.map((evt) => (
          <li key={evt.id} className="mb-2">
            <div className="flex flex-col">
              <span className="font-medium">
                {STATUS_LABELS[evt.event] ?? evt.event}
              </span>
              <time dateTime={evt.createdAt} className="text-sm text-gray-500">
                {new Date(evt.createdAt).toLocaleString()}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
