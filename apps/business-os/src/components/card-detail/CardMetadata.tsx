import type { Card } from "@/lib/types";

import { formatDate } from "../board/date-utils";

interface CardMetadataProps {
  card: Card;
}

export function CardMetadata({ card }: CardMetadataProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
      <dl className="space-y-3">
        {/* Owner */}
        <div>
          <dt className="text-xs text-gray-500 font-medium">Owner</dt>
          <dd className="text-sm text-gray-900 mt-1">{card.Owner}</dd>
        </div>

        {/* Business */}
        {card.Business && (
          <div>
            <dt className="text-xs text-gray-500 font-medium">Business</dt>
            <dd className="text-sm text-gray-900 mt-1">{card.Business}</dd>
          </div>
        )}

        {/* Due date */}
        {card["Due-Date"] && (
          <div>
            <dt className="text-xs text-gray-500 font-medium">Due Date</dt>
            <dd className="text-sm text-gray-900 mt-1">
              {new Date(card["Due-Date"]).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
          </div>
        )}

        {/* Created */}
        {card.Created && (
          <div>
            <dt className="text-xs text-gray-500 font-medium">Created</dt>
            <dd className="text-sm text-gray-900 mt-1">
              {formatDate(card.Created)}
            </dd>
          </div>
        )}

        {/* Updated */}
        {card.Updated && (
          <div>
            <dt className="text-xs text-gray-500 font-medium">Last Updated</dt>
            <dd className="text-sm text-gray-900 mt-1">
              {formatDate(card.Updated)}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
