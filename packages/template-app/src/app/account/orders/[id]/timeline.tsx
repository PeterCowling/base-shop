import { formatTimestamp } from "@acme/date-utils";
import { listEvents } from "@acme/platform-core/repositories/reverseLogisticsEvents.server";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import shop from "../../../../../shop.json";

// i18n-exempt: Fallback labels for backend status codes
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
  const tBase = await getServerTranslations("en");
  const t = (key: string) => tBase(`account.orders.timeline.${key}`);
  const events = await listEvents(shop.id);
  const orderEvents = events
    .filter((e) => e.sessionId === params.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="mx-auto p-6">
      <h1 className="mb-4 text-xl font-bold">{t("title")}</h1>
      <ol className="border-l border-gray-200 pl-4">
        {orderEvents.map((evt) => (
          <li key={evt.id} className="mb-2">
            <div className="flex flex-col">
              <span className="font-medium">
                {STATUS_LABELS[evt.event] ?? evt.event}
              </span>
              <time dateTime={evt.createdAt} className="text-sm text-gray-500">
                {formatTimestamp(evt.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
